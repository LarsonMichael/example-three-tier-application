const express = require('express');
const db = require('./db');
const logger = require('./logger');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  // Capture the original res.json and res.status methods
  const originalJson = res.json.bind(res);
  const originalStatus = res.status.bind(res);

  let statusCode = 200;
  res.status = function(code) {
    statusCode = code;
    return originalStatus(code);
  };

  res.json = function(data) {
    const duration = Date.now() - startTime;
    logger.info('Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode,
      duration,
    });
    return originalJson(data);
  };

  // Handle errors
  const originalSend = res.send.bind(res);
  res.send = function(data) {
    if (!res.headersSent) {
      const duration = Date.now() - startTime;
      logger.info('Request completed', {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
      });
    }
    return originalSend(data);
  };

  next();
});

app.get('/health', (_req, res) => {
  logger.debug('Health check requested');
  res.json({ status: 'ok' });
});

// GET /tasks — list all tasks
app.get('/tasks', async (req, res) => {
  try {
    logger.debug('Fetching all tasks');
    const { rows } = await db.query('SELECT * FROM tasks ORDER BY created_at ASC');
    logger.info('Tasks fetched successfully', { taskCount: rows.length });
    res.json(rows);
  } catch (error) {
    logger.error('Failed to fetch tasks', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /tasks — create a task
app.post('/tasks', async (req, res) => {
  try {
    const { title } = req.body;

    logger.debug('Creating new task', { titleLength: title ? title.length : 0 });

    if (!title || typeof title !== 'string' || !title.trim()) {
      logger.warn('Invalid task creation request', { reason: 'missing or invalid title' });
      return res.status(400).json({ error: 'title is required' });
    }

    const trimmedTitle = title.trim();
    const { rows } = await db.query(
      'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
      [trimmedTitle]
    );

    const newTask = rows[0];
    logger.info('Task created successfully', { taskId: newTask.id, title: trimmedTitle });
    res.status(201).json(newTask);
  } catch (error) {
    logger.error('Failed to create task', { error: error.message });
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /tasks/:id — update a task (complete/uncomplete or rename)
app.patch('/tasks/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { completed, title } = req.body;

    logger.debug('Updating task', { taskId: id, hasCompleted: completed !== undefined, hasTitle: title !== undefined });

    if (isNaN(id)) {
      logger.warn('Invalid task update request', { reason: 'invalid task id', id: req.params.id });
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
    if (rows.length === 0) {
      logger.warn('Task not found', { taskId: id });
      return res.status(404).json({ error: 'Not found' });
    }

    const current = rows[0];
    const newCompleted = completed !== undefined ? Boolean(completed) : current.completed;
    const newTitle = title !== undefined ? title.trim() : current.title;

    const { rows: updated } = await db.query(
      'UPDATE tasks SET completed = $1, title = $2 WHERE id = $3 RETURNING *',
      [newCompleted, newTitle, id]
    );

    logger.info('Task updated successfully', {
      taskId: id,
      completedChanged: newCompleted !== current.completed,
      titleChanged: newTitle !== current.title,
    });

    res.json(updated[0]);
  } catch (error) {
    logger.error('Failed to update task', { error: error.message, taskId: req.params.id });
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// Error handling middleware
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
  });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info('API server started', { port: PORT, environment: process.env.NODE_ENV || 'development' });
});
