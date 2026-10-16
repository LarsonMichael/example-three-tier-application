const { randomUUID } = require('node:crypto');
const log = require('./logger');
const { runWithContext } = require('./context');

const REQUEST_ID_HEADER = 'x-request-id';
const MAX_REQUEST_ID_LENGTH = 128;

function resolveRequestId(req) {
  const incoming = req.get(REQUEST_ID_HEADER);
  if (incoming && incoming.length <= MAX_REQUEST_ID_LENGTH && /^[\w.-]+$/.test(incoming)) {
    return incoming;
  }
  return randomUUID();
}

// Assigns a request id (reusing the caller's x-request-id so it propagates
// across tiers) and makes it available to every log line in this request.
function requestId(req, res, next) {
  const id = resolveRequestId(req);
  req.id = id;
  res.setHeader(REQUEST_ID_HEADER, id);
  runWithContext({ requestId: id }, next);
}

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  log.debug({ method: req.method, path: req.path }, 'request received');

  res.on('finish', () => {
    const duration = Number(process.hrtime.bigint() - start) / 1e6;
    const fields = {
      method: req.method,
      path: req.originalUrl.split('?')[0],
      statusCode: res.statusCode,
      duration: Math.round(duration * 100) / 100,
    };
    if (req.taskId !== undefined) fields.taskId = req.taskId;

    if (res.statusCode >= 500) log.error(fields, 'request failed');
    else if (req.path === '/health') log.debug(fields, 'health check');
    else if (res.statusCode >= 400) log.warn(fields, 'request rejected');
    else log.info(fields, 'request completed');
  });

  next();
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode;
  const clientError = status >= 400 && status < 500;

  if (clientError) {
    log.warn(
      { reason: err.message, method: req.method, path: req.path, statusCode: status },
      'client error'
    );
  } else {
    log.error(
      { err, method: req.method, path: req.path, taskId: req.taskId },
      'unhandled error'
    );
  }

  if (res.headersSent) return;
  if (clientError) return res.status(status).json({ error: err.message });
  res.status(500).json({ error: 'Internal server error' });
}

module.exports = { requestId, requestLogger, errorHandler };
