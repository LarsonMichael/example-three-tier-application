import { randomUUID } from 'node:crypto';
import { log, serializeError } from './logger';

const API_URL = process.env.API_URL || 'http://localhost:3001';

type ApiFetchOptions = RequestInit & {
  // Extra fields (e.g. taskId) to include in the log lines for this call.
  logContext?: Record<string, unknown>;
};

// fetch wrapper for calls to the API tier. Propagates a request id, and logs
// the endpoint, status and duration of failed calls (debug-level when ok).
export async function apiFetch(
  path: string,
  { logContext = {}, ...init }: ApiFetchOptions = {}
): Promise<Response> {
  const method = init.method || 'GET';
  const requestId = randomUUID();
  const headers = new Headers(init.headers);
  headers.set('x-request-id', requestId);

  const start = performance.now();
  const context = { requestId, method, endpoint: path, ...logContext };
  const elapsed = () => Math.round((performance.now() - start) * 100) / 100;

  try {
    const res = await fetch(`${API_URL}${path}`, { ...init, headers });
    const fields = { ...context, statusCode: res.status, duration: elapsed() };
    if (res.ok) log.debug(fields, 'api call succeeded');
    else log.error(fields, 'api call failed');
    return res;
  } catch (err) {
    log.error({ ...context, duration: elapsed(), err: serializeError(err) }, 'api call errored');
    throw err;
  }
}
