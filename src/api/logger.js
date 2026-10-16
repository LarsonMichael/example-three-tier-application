const pino = require('pino');
const { getContext } = require('./context');

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
  base: { service: 'api' },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: ['req.headers.authorization', 'req.headers.cookie'],
  serializers: { err: pino.stdSerializers.err },
  // Attach the current request's id (and other context) to every log line.
  mixin: () => ({ ...getContext() }),
  ...(canPrettyPrint() && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

module.exports = log;
