'use client';

import { useEffect } from 'react';
import { reportClientError } from './report-error';

export default function ErrorBoundary({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    void reportClientError({
      message: error.message,
      digest: error.digest,
      stack: error.stack,
      path: window.location.pathname,
    });
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-900 px-4">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Something went wrong
      </h2>
      <button
        onClick={() => unstable_retry()}
        className="rounded-lg bg-zinc-900 dark:bg-zinc-50 px-5 py-2 font-medium text-white dark:text-zinc-900"
      >
        Try again
      </button>
    </div>
  );
}
