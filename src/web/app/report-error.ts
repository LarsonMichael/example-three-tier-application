'use server';

import { log } from '@/lib/logger';

const MAX_FIELD_LENGTH = 2000;

export type ClientErrorReport = {
  message: string;
  digest?: string;
  stack?: string;
  path?: string;
};

function field(value: unknown): string | undefined {
  return typeof value === 'string' ? value.slice(0, MAX_FIELD_LENGTH) : undefined;
}

// Receives errors caught by client-side error boundaries so they end up in
// the server logs. Input comes from the browser, so it is treated as untrusted.
export async function reportClientError(report: unknown): Promise<void> {
  const input = (typeof report === 'object' && report !== null ? report : {}) as Record<
    string,
    unknown
  >;
  log.error(
    {
      source: 'client',
      message: field(input.message),
      digest: field(input.digest),
      stack: field(input.stack),
      path: field(input.path),
    },
    'client error reported'
  );
}
