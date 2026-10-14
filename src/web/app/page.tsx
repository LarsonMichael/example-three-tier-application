'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  getTasks,
  createTask,
  toggleTask,
  type Task,
  type ActionResult,
} from './actions';
import { ErrorDisplay, SuccessDisplay } from './error-display';
import { TaskListSkeleton } from './task-skeleton';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load tasks on mount
  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    setIsLoading(true);
    setError(null);

    const result = await getTasks();

    if (result.success && result.data) {
      setTasks(result.data);
    } else {
      setError(result.error || 'Failed to load tasks');
    }

    setIsLoading(false);
  }

  async function handleCreateTask(formData: FormData) {
    setError(null);
    setSuccessMessage(null);

    startTransition(async () => {
      const result = await createTask(formData);

      if (result.success) {
        setSuccessMessage('Task created successfully');
        // Reload tasks to get the latest list
        await loadTasks();
        // Clear the form
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) {
          form.reset();
        }
      } else {
        setError(result.error || 'Failed to create task');
      }
    });
  }

  async function handleToggleTask(id: number, completed: boolean) {
    setError(null);

    startTransition(async () => {
      const result = await toggleTask(id, completed);

      if (result.success) {
        // Update local state optimistically
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            task.id === id ? { ...task, completed } : task
          )
        );
      } else {
        setError(result.error || 'Failed to update task');
        // Reload tasks to sync with server
        await loadTasks();
      }
    });
  }

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 py-16 px-4">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 mb-8">
          To-Do List
        </h1>

        {/* Error Display */}
        <ErrorDisplay error={error} onDismiss={() => setError(null)} />

        {/* Success Display */}
        <SuccessDisplay
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />

        {/* Add task form */}
        <form action={handleCreateTask} className="flex gap-2 mb-8">
          <input
            name="title"
            type="text"
            required
            placeholder="Add a new task..."
            disabled={isPending || isLoading}
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={isPending || isLoading}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-50 px-5 py-2 font-medium text-white dark:text-zinc-900 hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Adding...' : 'Add'}
          </button>
        </form>

        {/* Task list */}
        {isLoading ? (
          <TaskListSkeleton count={3} />
        ) : (
          <ul className="space-y-2">
            {totalCount === 0 && (
              <li className="text-zinc-400 text-center py-8">
                No tasks yet. Add one above!
              </li>
            )}
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-4 py-3 transition-opacity"
              >
                <form
                  action={async () => {
                    'use server';
                    await handleToggleTask(task.id, !task.completed);
                  }}
                  className="flex-shrink-0"
                >
                  <button
                    type="submit"
                    disabled={isPending}
                    className={`h-5 w-5 rounded border-2 flex-shrink-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      task.completed
                        ? 'bg-zinc-900 dark:bg-zinc-50 border-zinc-900 dark:border-zinc-50'
                        : 'border-zinc-300 dark:border-zinc-600 hover:border-zinc-500'
                    }`}
                    aria-label={
                      task.completed ? 'Mark incomplete' : 'Mark complete'
                    }
                  >
                    {task.completed && (
                      <svg
                        viewBox="0 0 12 12"
                        className="text-white dark:text-zinc-900 w-full h-full p-0.5"
                      >
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </form>
                <span
                  className={`flex-1 text-sm ${
                    task.completed
                      ? 'line-through text-zinc-400'
                      : 'text-zinc-800 dark:text-zinc-100'
                  }`}
                >
                  {task.title}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* Progress indicator */}
        {totalCount > 0 && !isLoading && (
          <div className="mt-6 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">Progress</span>
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {completedCount} / {totalCount}
              </span>
            </div>
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
              <div
                className="bg-zinc-900 dark:bg-zinc-50 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
