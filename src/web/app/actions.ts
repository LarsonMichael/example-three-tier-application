'use server';

import { revalidatePath } from 'next/cache';

const API_URL = process.env.API_URL || 'http://localhost:3001';

// ============================================================================
// Types
// ============================================================================

export type Task = {
  id: number;
  title: string;
  completed: boolean;
  created_at: string;
  updated_at?: string;
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  details?: Record<string, unknown>;
};

export type ActionResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

// ============================================================================
// Error Handling Utilities
// ============================================================================

class APIClientError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'APIClientError';
  }
}

function logError(error: unknown, context: string) {
  const timestamp = new Date().toISOString();
  console.error(`[${timestamp}] [${context}]`, error);
}

async function handleApiResponse<T>(
  response: Response,
  context: string
): Promise<T> {
  if (!response.ok) {
    let errorData: ApiResponse<T> | null = null;
    try {
      errorData = await response.json();
    } catch {
      // Response is not JSON
    }

    const errorMessage =
      errorData?.message ||
      errorData?.error ||
      `API request failed with status ${response.status}`;

    const error = new APIClientError(
      errorMessage,
      response.status,
      errorData?.details
    );

    logError(error, context);
    throw error;
  }

  try {
    return await response.json();
  } catch (error) {
    const parseError = new Error('Failed to parse API response');
    logError(parseError, context);
    throw parseError;
  }
}

// ============================================================================
// Server Actions
// ============================================================================

export async function getTasks(): Promise<ActionResult<Task[]>> {
  try {
    const response = await fetch(`${API_URL}/tasks`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await handleApiResponse<ApiResponse<Task[]>>(
      response,
      'getTasks'
    );

    return {
      success: true,
      data: data.data || [],
    };
  } catch (error) {
    const message =
      error instanceof APIClientError
        ? error.message
        : 'Failed to load tasks. Please try again.';

    logError(error, 'getTasks');

    return {
      success: false,
      error: message,
    };
  }
}

export async function createTask(
  formData: FormData
): Promise<ActionResult<Task>> {
  try {
    const title = formData.get('title') as string;

    // Client-side validation
    if (!title || typeof title !== 'string') {
      return {
        success: false,
        error: 'Title is required',
      };
    }

    if (title.trim().length === 0) {
      return {
        success: false,
        error: 'Title cannot be empty',
      };
    }

    if (title.length > 500) {
      return {
        success: false,
        error: 'Title must be 500 characters or less',
      };
    }

    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim() }),
    });

    const data = await handleApiResponse<ApiResponse<Task>>(
      response,
      'createTask'
    );

    // Revalidate the page to show the new task
    revalidatePath('/');

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    const message =
      error instanceof APIClientError
        ? error.message
        : 'Failed to create task. Please try again.';

    logError(error, 'createTask');

    return {
      success: false,
      error: message,
    };
  }
}

export async function toggleTask(
  id: number,
  completed: boolean
): Promise<ActionResult<Task>> {
  try {
    // Validation
    if (!Number.isInteger(id) || id <= 0) {
      return {
        success: false,
        error: 'Invalid task ID',
      };
    }

    if (typeof completed !== 'boolean') {
      return {
        success: false,
        error: 'Invalid completed status',
      };
    }

    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed }),
    });

    const data = await handleApiResponse<ApiResponse<Task>>(
      response,
      'toggleTask'
    );

    // Revalidate the page to show the updated task
    revalidatePath('/');

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    const message =
      error instanceof APIClientError
        ? error.message
        : 'Failed to update task. Please try again.';

    logError(error, 'toggleTask');

    return {
      success: false,
      error: message,
    };
  }
}

export async function updateTaskTitle(
  id: number,
  title: string
): Promise<ActionResult<Task>> {
  try {
    // Validation
    if (!Number.isInteger(id) || id <= 0) {
      return {
        success: false,
        error: 'Invalid task ID',
      };
    }

    if (!title || typeof title !== 'string') {
      return {
        success: false,
        error: 'Title is required',
      };
    }

    if (title.trim().length === 0) {
      return {
        success: false,
        error: 'Title cannot be empty',
      };
    }

    if (title.length > 500) {
      return {
        success: false,
        error: 'Title must be 500 characters or less',
      };
    }

    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim() }),
    });

    const data = await handleApiResponse<ApiResponse<Task>>(
      response,
      'updateTaskTitle'
    );

    // Revalidate the page to show the updated task
    revalidatePath('/');

    return {
      success: true,
      data: data.data,
    };
  } catch (error) {
    const message =
      error instanceof APIClientError
        ? error.message
        : 'Failed to update task. Please try again.';

    logError(error, 'updateTaskTitle');

    return {
      success: false,
      error: message,
    };
  }
}
