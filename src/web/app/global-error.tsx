'use client';

import { useEffect } from 'react';
import { reportClientError } from './report-error';

export default function GlobalError({
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
    <html lang="en">
      <body>
        <h2>Something went wrong</h2>
        <button onClick={() => unstable_retry()}>Try again</button>
      </body>
    </html>
  );
}
