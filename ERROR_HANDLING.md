# Error Handling Guide

This document describes the comprehensive error handling implemented in the three-tier application.

## Overview

The application implements error handling at three levels:

1. **API Layer** (Express backend)
2. **Frontend Server Actions** (Next.js server-side logic)
3. **Frontend UI** (React components)

## API Error Handling

### Error Classes

The API defines custom error classes for different error scenarios:

- **`APIError`** - Base error class with status code and optional details
- **`ValidationError`** - 400 Bad Request errors for invalid input
- **`NotFoundError`** - 404 Not Found errors for missing resources
- **`DatabaseError`** - 500 Internal Server Error for database operations

### Error Response Format

All API errors follow a consistent JSON format:

```json
{
  "success": false,
  "error": "ErrorClassName",
  "message": "Human-readable error message",
  "details": {
    "field": "additional context"
  }
}
```

### Validation

The API validates all incoming requests:

- **POST /tasks** - Validates `title` field:
  - Required and must be a string
  - Cannot be empty or whitespace-only
  - Maximum 500 characters

- **PATCH /tasks/:id** - Validates:
  - Task ID must be a positive integer
  - At least one field (`completed` or `title`) must be provided
  - `completed` must be a boolean if provided
  - `title` must be a non-empty string with max 500 characters

### Error Logging

Errors are logged with:
- Timestamp
- Error name and message
- HTTP status code
- Request context (method, path)
- Stack trace (in development only)

### Async Error Handling

All route handlers are wrapped with `asyncHandler()` to catch promise rejections and pass them to the error middleware.

### Database Error Handling

- Connection errors are caught and logged
- Database query errors are wrapped in `DatabaseError`
- Connection pool errors are monitored and logged

## Frontend Server Actions Error Handling

### Error Handling Pattern

Each server action follows this pattern:

```typescript
export async function actionName(params): Promise<ActionResult<T>> {
  try {
    // Client-side validation
    if (!isValid(params)) {
      return { success: false, error: 'Validation error message' };
    }

    // API call
    const response = await fetch(`${API_URL}/endpoint`, options);
    const data = await handleApiResponse(response, 'actionName');

    // Revalidate cache
    revalidatePath('/');

    return { success: true, data: data.data };
  } catch (error) {
    logError(error, 'actionName');
    return { success: false, error: 'User-friendly error message' };
  }
}
```

### Response Types

- **`ActionResult<T>`** - Result of a server action with success flag and data or error
- **`ApiResponse<T>`** - Response from the API with success flag and data or error details

### Error Handling Utilities

- **`APIClientError`** - Custom error class for API client errors
- **`handleApiResponse()`** - Parses API responses and throws errors for non-OK status codes
- **`logError()`** - Logs errors with context information

### Validation

Client-side validation is performed before API calls:

- **createTask** - Validates title is non-empty and ≤500 characters
- **toggleTask** - Validates task ID is a positive integer and completed is boolean
- **updateTaskTitle** - Validates task ID and title constraints

## Frontend UI Error Handling

### Error Display Component

The `ErrorDisplay` component shows error messages with:
- Red styling for visibility
- Auto-dismiss after 5 seconds (configurable)
- Manual dismiss button
- Smooth animations

### Success Display Component

The `SuccessDisplay` component shows success messages with:
- Green styling
- Auto-dismiss after 3 seconds (configurable)
- Manual dismiss button

### Loading States

- **Loading skeleton** - Shows placeholder while loading tasks
- **Disabled form** - Input and button disabled during submission
- **Button text** - Changes to "Adding..." during submission

### Error Recovery

- **Retry on error** - Users can retry failed operations
- **Auto-reload** - Tasks are reloaded after errors to sync with server
- **Optimistic updates** - UI updates immediately, reverts on error

### Global Error Boundary

The `error.tsx` component catches unhandled errors and provides:
- User-friendly error message
- Error details in development mode
- "Try again" button to reset the component

## Best Practices

### API Development

1. Always validate input before processing
2. Use appropriate HTTP status codes
3. Return consistent error response format
4. Log all errors with context
5. Wrap async handlers with `asyncHandler()`
6. Handle database errors gracefully

### Frontend Development

1. Always handle API errors in server actions
2. Provide user-friendly error messages
3. Validate input before sending to API
4. Log errors for debugging
5. Show loading states during operations
6. Provide error recovery options

### User Experience

1. Show clear, actionable error messages
2. Auto-dismiss non-critical messages
3. Allow manual dismissal of messages
4. Disable UI during operations
5. Provide visual feedback for all actions
6. Maintain data consistency on errors

## Testing Error Scenarios

### API Testing

```bash
# Invalid title (missing)
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{}'

# Invalid title (empty)
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "   "}'

# Invalid task ID
curl -X PATCH http://localhost:3001/tasks/invalid \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'

# Task not found
curl -X PATCH http://localhost:3001/tasks/99999 \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

### Frontend Testing

1. Try creating a task with empty title
2. Try creating a task with very long title (>500 chars)
3. Disconnect API and try operations
4. Check browser console for error logs
5. Verify error messages appear and auto-dismiss
6. Test error recovery by retrying operations

## Future Improvements

1. Add retry logic with exponential backoff
2. Implement request timeout handling
3. Add rate limiting error handling
4. Implement offline mode with local storage
5. Add error tracking service integration (e.g., Sentry)
6. Add more specific error codes for API responses
7. Implement circuit breaker pattern for API calls
8. Add request/response logging middleware
