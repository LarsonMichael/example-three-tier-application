const express = require('express');
const db = require('./db');
const log = require('./logger');
const { requestId, requestLogger, errorHandler } = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(requestId);
app.use(requestLogger);
app.use(express.json());

// Record the task id so request logs can include it.
app.param('id', (req, _res, next, id) => {
  req.taskId = id;
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// GET /tasks — list all tasks
app.get('/tasks', async (_req, res) => {
  const { rows } = await db.query('SELECT * FROM tasks ORDER BY created_at ASC');
  res.json(rows);
});

// POST /tasks — create a task
app.post('/tasks', async (req, res) => {
  const { title } = req.body;
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'title is required' });
  }
  const { rows } = await db.query(
    'INSERT INTO tasks (title) VALUES ($1) RETURNING *',
    [title.trim()]
  );
  log.info({ taskId: rows[0].id }, 'task created');
  res.status(201).json(rows[0]);
});

// PATCH /tasks/:id — update a task (complete/uncomplete or rename)
app.patch('/tasks/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { completed, title } = req.body;

  const { rows } = await db.query('SELECT * FROM tasks WHERE id = $1', [id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Not found' });

  const current = rows[0];
  const newCompleted = completed !== undefined ? Boolean(completed) : current.completed;
  const newTitle = title !== undefined ? title.trim() : current.title;

  const { rows: updated } = await db.query(
    'UPDATE tasks SET completed = $1, title = $2 WHERE id = $3 RETURNING *',
    [newCompleted, newTitle, id]
  );
  log.info({ taskId: id, completed: newCompleted }, 'task updated');
  res.json(updated[0]);
});

app.use(errorHandler);

app.listen(PORT, () => {
  log.info({ port: PORT, logLevel: log.level }, 'API listening');
});

process.on('unhandledRejection', (reason) => {
  log.error({ err: reason }, 'unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  log.fatal({ err }, 'uncaught exception');
  process.exit(1);
});
