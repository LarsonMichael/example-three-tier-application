'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                Something went wrong
              </h2>
              <p className="text-sm text-red-700 dark:text-red-300 mb-4">
                An unexpected error occurred. Please try again or contact support if the problem persists.
              </p>
              {process.env.NODE_ENV === 'development' && (
                <details className="mb-4 text-xs text-red-600 dark:text-red-400">
                  <summary className="cursor-pointer font-mono font-semibold mb-2">
                    Error details
                  </summary>
                  <pre className="bg-red-100 dark:bg-red-900/30 p-2 rounded overflow-auto max-h-40">
                    {error.message}
                    {error.stack && `\n\n${error.stack}`}
                  </pre>
                </details>
              )}
              <button
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 dark:bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 dark:hover:bg-red-600 transition-colors"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 1119.414 5.414 1 1 0 11-1.414-1.414A5.002 5.002 0 005.659 5.242V4a1 1 0 011-1H4z"
                    clipRule="evenodd"
                  />
                </svg>
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
