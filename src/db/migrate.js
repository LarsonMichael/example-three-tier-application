const path = require('node:path');
const log = require('./logger');

const direction = process.argv[2] || 'up';

async function main() {
  if (direction !== 'up' && direction !== 'down') {
    throw new Error(`Unknown direction "${direction}", expected "up" or "down"`);
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }

  // node-pg-migrate is ESM; a dynamic import works from CommonJS.
  const { runner } = await import('node-pg-migrate');

  const start = process.hrtime.bigint();
  log.info({ direction }, 'migration run started');

  const migrations = await runner({
    databaseUrl: process.env.DATABASE_URL,
    dir: path.join(__dirname, 'migrations'),
    migrationsTable: 'pgmigrations',
    direction,
    count: direction === 'down' ? 1 : Infinity,
    logger: {
      debug: (msg) => log.debug(msg),
      info: (msg) => log.info(msg),
      warn: (msg) => log.warn(msg),
      error: (msg) => log.error(msg),
    },
  });

  const duration = Math.round(Number(process.hrtime.bigint() - start) / 1e4) / 100;
  log.info(
    { direction, count: migrations.length, migrations: migrations.map((m) => m.name), duration },
    'migration run finished'
  );
}

main().catch((err) => {
  log.error({ err, direction }, 'migration run failed');
  process.exitCode = 1;
});
