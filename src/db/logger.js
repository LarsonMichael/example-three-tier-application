const pino = require('pino');

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
  base: { service: 'migrate' },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label, severity: SEVERITY[label] }),
  },
  serializers: { err: pino.stdSerializers.err },
  ...(canPrettyPrint() && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, messageKey: 'message', ignore: 'severity' },
    },
  }),
});

module.exports = log;
