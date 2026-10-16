'use server';

import { revalidatePath } from 'next/cache';
import { apiFetch } from '@/lib/api';
import { log } from '@/lib/logger';

export type Task = {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
};

export async function getTasks(): Promise<Task[]> {
  const res = await apiFetch('/tasks', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch tasks');
  return res.json();
}

export async function createTask(formData: FormData) {
  const title = formData.get('title') as string;
  const res = await apiFetch('/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (res.ok) log.info({ action: 'createTask' }, 'user action');
  revalidatePath('/');
}

export async function toggleTask(id: number, completed: boolean) {
  const res = await apiFetch(`/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
    logContext: { taskId: id },
  });
  if (res.ok) log.info({ action: 'toggleTask', taskId: id, completed }, 'user action');
  revalidatePath('/');
}
