const pino = require('pino');

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
  base: { service: 'migrate' },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: { err: pino.stdSerializers.err },
  ...(canPrettyPrint() && {
    transport: { target: 'pino-pretty', options: { colorize: true } },
  }),
});

module.exports = log;
