const express = require('express');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// ============================================================================
// Error Handling Utilities
// ============================================================================

class APIError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'APIError';
  }
}

class ValidationError extends APIError {
  constructor(message, details = null) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class DatabaseError extends APIError {
  constructor(message = 'Database operation failed', originalError = null) {
    super(message, 500, originalError?.message);
    this.name = 'DatabaseError';
  }
}

// Logging utility
function logError(error, context = {}) {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    name: error.name,
    message: error.message,
    statusCode: error.statusCode || 500,
    ...context,
  };
  
  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', JSON.stringify(errorInfo, null, 2));
    if (error.stack) {
      console.error('[STACK]', error.stack);
    }
  } else {
    console.error(JSON.stringify(errorInfo));
  }
}

// Async route wrapper to catch errors
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// ============================================================================
// Routes
// ============================================================================

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /tasks — list all tasks
app.get('/tasks', asyncHandler(async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM tasks ORDER BY created_at ASC');
    res.json({
      success: true,
      data: rows,
      count: rows.length,
    });
  } catch (error) {
    throw new DatabaseError('Failed to fetch tasks', error);
  }
}));

// POST /tasks — create a task
app.post('/tasks', asyncHandler(async (req, res) => {
  const { title } = req.body;

  // Validation
  if (title === undefined) {
    throw new ValidationError('Missing required field: title');
  }

  if (typeof title !== 'string') {
    throw new ValidationError('Field "title" must be a string', { received: typeof title });
  }

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new ValidationError('Field "title" cannot be empty or whitespace only');
  }

  if (trimmedTitle.length > 500) {
    throw new ValidationError('Field "title" must be 500 characters or less', {
      length: trimmedTitle.length,
    });
  }

  try {
    const { rows } = await db.query(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
      [trimmedTitle]
    );
    res.status(201).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    throw new DatabaseError('Failed to create task', error);
  }
}));

// PATCH /tasks/:id — update a task (complete/uncomplete or rename)
app.patch('/tasks/:id', asyncHandler(async (req, res) => {
  const id = parseInt(req.params.id, 10);

  // Validation
  if (isNaN(id) || id <= 0) {
    throw new ValidationError('Invalid task ID', { received: req.params.id });
  }

  const { completed, title } = req.body;

  // At least one field must be provided
  if (completed === undefined && title === undefined) {
    throw new ValidationError('At least one field (completed or title) must be provided');
  }

  // Validate completed if provided
  if (completed !== undefined && typeof completed !== 'boolean') {
    throw new ValidationError('Field "completed" must be a boolean', {
      received: typeof completed,
    });
  }

  // Validate title if provided
  if (title !== undefined) {
    if (typeof title !== 'string') {
      throw new ValidationError('Field "title" must be a string', { received: typeof title });
    }

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw new ValidationError('Field "title" cannot be empty or whitespace only');
    }

    if (trimmedTitle.length > 500) {
      throw new ValidationError('Field "title" must be 500 characters or less', {
        length: trimmedTitle.length,
      });
    }
  }

  try {
    // Fetch current task
    const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (rows.length === 0) {
      throw new NotFoundError(`Task with ID ${id} not found`);
    }

    const current = rows[0];
    const newCompleted = completed !== undefined ? Boolean(completed) : current.completed;
    const newTitle = title !== undefined ? title.trim() : current.title;

    // Update task
    const { rows: updated } = await db.query(
      'UPDATE tasks SET completed = $1, title = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
      [newCompleted, newTitle, id]
    );

    res.json({
      success: true,
      data: updated[0],
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to update task', error);
  }
}));

// ============================================================================
// Error Handling Middleware
// ============================================================================

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
  });
});

// Global error handler (must be last)
app.use((err, _req, res, _next) => {
  // Log the error
  logError(err, {
    method: _req.method,
    path: _req.path,
  });

  // Handle known API errors
  if (err instanceof APIError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.name,
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  // Handle database connection errors
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      error: 'ServiceUnavailable',
      message: 'Database connection failed. Please try again later.',
    });
  }

  // Handle unexpected errors
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred'
      : err.message;

  res.status(statusCode).json({
    success: false,
    error: 'InternalServerError',
    message,
  });
});

// ============================================================================
// Server Startup
// ============================================================================

app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
