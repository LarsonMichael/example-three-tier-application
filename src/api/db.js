const { Pool } = require('pg');
const log = require('./logger');

const SLOW_QUERY_MS = 500;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (err) => {
  log.error({ err }, 'idle database client error');
});

// Query parameters are never logged: they may contain user-provided data.
async function query(text, params) {
  const start = process.hrtime.bigint();
  const elapsed = () => Math.round(Number(process.hrtime.bigint() - start) / 1e4) / 100;
  const operation = text.trim().split(/\s+/)[0].toUpperCase();

  try {
    const result = await pool.query(text, params);
    const duration = elapsed();
    const fields = { operation, duration, rowCount: result.rowCount };
    if (duration > SLOW_QUERY_MS) log.warn({ ...fields, query: text }, 'slow query');
    else log.debug({ ...fields, query: text }, 'query executed');
    return result;
  } catch (err) {
    log.error({ err, operation, duration: elapsed(), query: text }, 'query failed');
    throw err;
  }
}

module.exports = { query, pool };
