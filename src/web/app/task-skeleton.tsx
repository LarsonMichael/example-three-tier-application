'use client';

export function TaskSkeleton() {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 animate-pulse">
      <div className="h-5 w-5 rounded border-2 border-zinc-300 dark:border-zinc-600 flex-shrink-0 bg-zinc-200 dark:bg-zinc-700" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
      </div>
    </li>
  );
}

export function TaskListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <TaskSkeleton key={i} />
      ))}
    </ul>
  );
}
