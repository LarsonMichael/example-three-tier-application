'use server';

import { revalidatePath } from 'next/cache';
import { logger } from './logger';

const API_URL = process.env.API_URL || 'http://localhost:3001';

export type Task = {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
};

export async function getTasks(): Promise<Task[]> {
  const startTime = Date.now();
  try {
    logger.debug('Fetching tasks from API', { apiUrl: API_URL });
    
    const res = await fetch(`${API_URL}/tasks`, { cache: 'no-store' });
    
    if (!res.ok) {
      logger.error('Failed to fetch tasks from API', {
        status: res.status,
        statusText: res.statusText,
      });
      throw new Error('Failed to fetch tasks');
    }

    const tasks = await res.json();
    const duration = Date.now() - startTime;
    
    logger.info('Tasks fetched successfully', {
      taskCount: tasks.length,
      duration,
    });

    return tasks;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error fetching tasks', {
      error: error instanceof Error ? error.message : String(error),
      duration,
    });
    throw error;
  }
}

export async function createTask(formData: FormData) {
  const startTime = Date.now();
  const title = formData.get('title') as string;

  try {
    logger.debug('Creating new task', {
      titleLength: title ? title.length : 0,
    });

    const res = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      logger.error('Failed to create task', {
        status: res.status,
        statusText: res.statusText,
        error: errorData.error,
      });
      throw new Error('Failed to create task');
    }

    const newTask = await res.json();
    const duration = Date.now() - startTime;

    logger.info('Task created successfully', {
      taskId: newTask.id,
      title,
      duration,
    });

    revalidatePath('/');
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error creating task', {
      error: error instanceof Error ? error.message : String(error),
      title,
      duration,
    });
    throw error;
  }
}

export async function toggleTask(id: number, completed: boolean) {
  const startTime = Date.now();

  try {
    logger.debug('Toggling task completion status', {
      taskId: id,
      completed,
    });

    const res = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      logger.error('Failed to toggle task', {
        taskId: id,
        status: res.status,
        statusText: res.statusText,
        error: errorData.error,
      });
      throw new Error('Failed to toggle task');
    }

    const updatedTask = await res.json();
    const duration = Date.now() - startTime;

    logger.info('Task toggled successfully', {
      taskId: id,
      completed,
      duration,
    });

    revalidatePath('/');
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error toggling task', {
      taskId: id,
      completed,
      error: error instanceof Error ? error.message : String(error),
      duration,
    });
    throw error;
  }
}
