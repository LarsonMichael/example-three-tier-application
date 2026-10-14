const { Pool } = require('pg');
const logger = require('./logger');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Log pool events
pool.on('connect', () => {
  logger.debug('Database pool: new client connected');
});

pool.on('error', (err) => {
  logger.error('Database pool error', {
    error: err.message,
    code: err.code,
  });
});

// Wrap the query method to add logging
const originalQuery = pool.query.bind(pool);
pool.query = function(text, values, callback) {
  const startTime = Date.now();
  const logData = {
    query: text.substring(0, 100), // Log first 100 chars of query
    paramCount: values ? values.length : 0,
  };

  logger.debug('Database query started', logData);

  // Handle both callback and promise-based usage
  if (typeof callback === 'function') {
    return originalQuery(text, values, (err, result) => {
      const duration = Date.now() - startTime;
      if (err) {
        logger.error('Database query failed', {
          ...logData,
          duration,
          error: err.message,
        });
      } else {
        logger.debug('Database query completed', {
          ...logData,
          duration,
          rowCount: result.rowCount,
        });
      }
      callback(err, result);
    });
  } else {
    // Promise-based
    return originalQuery(text, values).then(
      (result) => {
        const duration = Date.now() - startTime;
        logger.debug('Database query completed', {
          ...logData,
          duration,
          rowCount: result.rowCount,
        });
        return result;
      },
      (err) => {
        const duration = Date.now() - startTime;
        logger.error('Database query failed', {
          ...logData,
          duration,
          error: err.message,
        });
        throw err;
      }
    );
  }
};

module.exports = pool;
