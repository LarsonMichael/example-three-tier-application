/**
 * Simple structured logging utility for the API
 */

const LOG_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
};

const LOG_LEVEL_PRIORITY = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

// Get the minimum log level from environment (default: INFO)
const MIN_LOG_LEVEL = process.env.LOG_LEVEL || 'INFO';

function formatTimestamp() {
  return new Date().toISOString();
}

function shouldLog(level) {
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[MIN_LOG_LEVEL];
}

function formatLog(level, message, data = {}) {
  const logEntry = {
    timestamp: formatTimestamp(),
    level,
    message,
    ...data,
  };
  return JSON.stringify(logEntry);
}

const logger = {
  debug: (message, data = {}) => {
    if (shouldLog('DEBUG')) {
      console.log(formatLog('DEBUG', message, data));
    }
  },

  info: (message, data = {}) => {
    if (shouldLog('INFO')) {
      console.log(formatLog('INFO', message, data));
    }
  },

  warn: (message, data = {}) => {
    if (shouldLog('WARN')) {
      console.warn(formatLog('WARN', message, data));
    }
  },

  error: (message, data = {}) => {
    if (shouldLog('ERROR')) {
      console.error(formatLog('ERROR', message, data));
    }
  },
};

module.exports = logger;
