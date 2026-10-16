// Server-side structured logger (JSON lines on stdout/stderr). Use only from
// server code: server components, server actions and route handlers.
type Level = 'debug' | 'info' | 'warn' | 'error';
export type LogFields = Record<string, unknown>;

const LEVELS: Record<Level, number> = { debug: 20, info: 30, warn: 40, error: 50 };

function configuredLevel(): number {
  const name = (process.env.LOG_LEVEL || 'info').toLowerCase();
  return name in LEVELS ? LEVELS[name as Level] : LEVELS.info;
}

const PRETTY = process.env.NODE_ENV === 'development';

export function serializeError(err: unknown): LogFields {
  if (err instanceof Error) {
    return { type: err.name, message: err.message, stack: err.stack };
  }
  return { message: String(err) };
}

function write(level: Level, fields: LogFields, msg: string) {
  if (LEVELS[level] < configuredLevel()) return;

  const entry = {
    level,
    time: new Date().toISOString(),
    service: 'web',
    ...fields,
    msg,
  };
  const line = PRETTY
    ? `${entry.time} ${level.toUpperCase()} ${msg} ${JSON.stringify(fields)}\n`
    : `${JSON.stringify(entry)}\n`;

  (level === 'error' || level === 'warn' ? process.stderr : process.stdout).write(line);
}

export const log = {
  debug: (fields: LogFields, msg: string) => write('debug', fields, msg),
  info: (fields: LogFields, msg: string) => write('info', fields, msg),
  warn: (fields: LogFields, msg: string) => write('warn', fields, msg),
  error: (fields: LogFields, msg: string) => write('error', fields, msg),
};
