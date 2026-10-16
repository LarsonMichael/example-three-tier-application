// Server-side structured logger (JSON lines on stdout/stderr). Use only from
// server code: server components, server actions and route handlers.
type Level = 'debug' | 'info' | 'warn' | 'error';
export type LogFields = Record<string, unknown>;

const LEVELS: Record<Level, number> = { debug: 20, info: 30, warn: 40, error: 50 };

// Cloud Logging reads `severity` and `message` from JSON log lines.
const SEVERITY: Record<Level, string> = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARNING',
  error: 'ERROR',
};

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

function write(level: Level, fields: LogFields, message: string) {
  if (LEVELS[level] < configuredLevel()) return;

  const time = new Date().toISOString();
  const line = PRETTY
    ? `${time} ${level.toUpperCase()} ${message} ${JSON.stringify(fields)}\n`
    : `${JSON.stringify({
        level,
        severity: SEVERITY[level],
        time,
        service: 'web',
        ...fields,
        message,
      })}\n`;

  (level === 'error' || level === 'warn' ? process.stderr : process.stdout).write(line);
}

export const log = {
  debug: (fields: LogFields, message: string) => write('debug', fields, message),
  info: (fields: LogFields, message: string) => write('info', fields, message),
  warn: (fields: LogFields, message: string) => write('warn', fields, message),
  error: (fields: LogFields, message: string) => write('error', fields, message),
};
