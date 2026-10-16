const pino = require('pino');
const { getContext } = require('./context');

// Cloud Logging reads `severity` and `message` from JSON log lines.
const SEVERITY = {
  trace: 'DEBUG',
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
  fatal: 'CRITICAL',
};

function canPrettyPrint() {
  if (process.env.NODE_ENV === 'production') return false;
  try {
    require.resolve('pino-pretty');
    return true;
  } catch {
    return false;
  }
}

const log = pino({
  level: process.env.LOG_LEVEL || 'info',
  messageKey: 'message',
  base: { service: 'api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label, severity: SEVERITY[label] }),
  },
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  serializers: { err: pino.stdSerializers.err },
  // Attach the current request's id (and other context) to every log line.
  mixin: () => ({ ...getContext() }),
  ...(canPrettyPrint() && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, messageKey: 'message', ignore: 'severity' },
    },
  }),
});

module.exports = log;
