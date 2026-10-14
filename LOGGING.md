# Comprehensive Logging Guide

This document describes the logging implementation across the three-tier application.

## Overview

The application implements structured JSON logging across all three tiers:
- **API Layer** (Express.js)
- **Web Layer** (Next.js)
- **Database Layer** (PostgreSQL via pg)

All logs are output in JSON format for easy parsing and aggregation by logging services.

## Log Levels

The application supports four log levels, in order of severity:

1. **DEBUG** - Detailed diagnostic information (lowest priority)
2. **INFO** - General informational messages
3. **WARN** - Warning messages for potentially problematic situations
4. **ERROR** - Error messages for failures (highest priority)

## Configuring Log Level

Set the `LOG_LEVEL` environment variable to control which logs are output:

```bash
# Only show INFO and above (default)
LOG_LEVEL=INFO

# Show all logs including DEBUG
LOG_LEVEL=DEBUG

# Only show WARN and ERROR
LOG_LEVEL=WARN

# Only show ERROR
LOG_LEVEL=ERROR
```

## API Layer Logging

### Location
`src/api/logger.js` - Logging utility
`src/api/index.js` - Route handlers with logging
`src/api/db.js` - Database query logging

### What Gets Logged

#### Server Startup
```json
{
  "timestamp": "2024-01-15T10:30:45.123Z",
  "level": "INFO",
  "message": "API server started",
  "port": 3001,
  "environment": "development"
}
```

#### Incoming Requests
```json
{
  "timestamp": "2024-01-15T10:30:46.000Z",
  "level": "INFO",
  "message": "Incoming request",
  "requestId": "1705318246000-abc123def",
  "method": "GET",
  "path": "/tasks",
  "ip": "127.0.0.1"
}
```

#### Request Completion
```json
{
  "timestamp": "2024-01-15T10:30:46.050Z",
  "level": "INFO",
  "message": "Request completed",
  "requestId": "1705318246000-abc123def",
  "method": "GET",
  "path": "/tasks",
  "statusCode": 200,
  "duration": 50
}
```

#### Database Queries
```json
{
  "timestamp": "2024-01-15T10:30:46.010Z",
  "level": "DEBUG",
  "message": "Database query started",
  "query": "SELECT * FROM tasks ORDER BY created_at ASC",
  "paramCount": 0
}
```

```json
{
  "timestamp": "2024-01-15T10:30:46.040Z",
  "level": "DEBUG",
  "message": "Database query completed",
  "query": "SELECT * FROM tasks ORDER BY created_at ASC",
  "paramCount": 0,
  "duration": 30,
  "rowCount": 5
}
```

#### Task Operations
```json
{
  "timestamp": "2024-01-15T10:30:47.000Z",
  "level": "INFO",
  "message": "Task created successfully",
  "taskId": 42,
  "title": "Buy groceries"
}
```

#### Errors
```json
{
  "timestamp": "2024-01-15T10:30:48.000Z",
  "level": "ERROR",
  "message": "Failed to fetch tasks",
  "error": "Connection refused"
}
```

### Request ID Tracking

Each incoming request is assigned a unique `requestId` that appears in all related logs, making it easy to trace a single request through the system.

## Web Layer Logging

### Location
`src/web/app/logger.ts` - Logging utility
`src/web/app/actions.ts` - Server actions with logging

### What Gets Logged

#### Task Fetching
```json
{
  "timestamp": "2024-01-15T10:30:46.000Z",
  "level": "DEBUG",
  "message": "Fetching tasks from API",
  "apiUrl": "http://localhost:3001"
}
```

```json
{
  "timestamp": "2024-01-15T10:30:46.050Z",
  "level": "INFO",
  "message": "Tasks fetched successfully",
  "taskCount": 5,
  "duration": 50
}
```

#### Task Creation
```json
{
  "timestamp": "2024-01-15T10:30:47.000Z",
  "level": "DEBUG",
  "message": "Creating new task",
  "titleLength": 14
}
```

```json
{
  "timestamp": "2024-01-15T10:30:47.100Z",
  "level": "INFO",
  "message": "Task created successfully",
  "taskId": 42,
  "title": "Buy groceries",
  "duration": 100
}
```

#### Task Toggle
```json
{
  "timestamp": "2024-01-15T10:30:48.000Z",
  "level": "DEBUG",
  "message": "Toggling task completion status",
  "taskId": 42,
  "completed": true
}
```

#### Errors
```json
{
  "timestamp": "2024-01-15T10:30:48.500Z",
  "level": "ERROR",
  "message": "Error creating task",
  "error": "Failed to create task",
  "title": "Buy groceries",
  "duration": 500
}
```

## Database Layer Logging

### Location
`src/api/db.js` - Database connection and query logging

### What Gets Logged

#### Connection Events
```json
{
  "timestamp": "2024-01-15T10:30:45.200Z",
  "level": "DEBUG",
  "message": "Database pool: new client connected"
}
```

#### Query Performance
All database queries are logged with:
- Query text (first 100 characters)
- Number of parameters
- Execution duration (in milliseconds)
- Row count affected

This helps identify slow queries and performance bottlenecks.

#### Connection Errors
```json
{
  "timestamp": "2024-01-15T10:30:45.300Z",
  "level": "ERROR",
  "message": "Database pool error",
  "error": "ECONNREFUSED",
  "code": "ECONNREFUSED"
}
```

## Log Output Format

All logs are output as single-line JSON objects, one per line. This format is ideal for:
- Parsing by log aggregation services (ELK, Datadog, CloudWatch, etc.)
- Searching and filtering
- Structured analysis

Example log stream:
```
{"timestamp":"2024-01-15T10:30:45.123Z","level":"INFO","message":"API server started","port":3001,"environment":"development"}
{"timestamp":"2024-01-15T10:30:46.000Z","level":"INFO","message":"Incoming request","requestId":"1705318246000-abc123def","method":"GET","path":"/tasks","ip":"127.0.0.1"}
{"timestamp":"2024-01-15T10:30:46.010Z","level":"DEBUG","message":"Database query started","query":"SELECT * FROM tasks ORDER BY created_at ASC","paramCount":0}
{"timestamp":"2024-01-15T10:30:46.040Z","level":"DEBUG","message":"Database query completed","query":"SELECT * FROM tasks ORDER BY created_at ASC","paramCount":0,"duration":30,"rowCount":5}
{"timestamp":"2024-01-15T10:30:46.050Z","level":"INFO","message":"Request completed","requestId":"1705318246000-abc123def","method":"GET","path":"/tasks","statusCode":200,"duration":50}
```

## Using Logs for Debugging

### Find all errors
```bash
grep '"level":"ERROR"' logs.txt
```

### Find slow requests (> 1000ms)
```bash
grep '"level":"INFO"' logs.txt | grep '"message":"Request completed"' | awk -F'"duration":' '{print $2}' | awk '{if ($1 > 1000) print}'
```

### Trace a single request
```bash
grep 'requestId":"1705318246000-abc123def' logs.txt
```

### Find failed database queries
```bash
grep '"level":"ERROR"' logs.txt | grep '"message":"Database query failed"'
```

## Performance Considerations

- Logging is structured and efficient
- DEBUG logs can be disabled in production by setting `LOG_LEVEL=INFO`
- Database query logging includes timing information to identify performance issues
- Request timing helps identify slow endpoints

## Future Enhancements

Potential improvements to the logging system:
1. Add request body/response logging (with sensitive data redaction)
2. Add user/session tracking
3. Add distributed tracing support (e.g., OpenTelemetry)
4. Add metrics collection (request counts, error rates, etc.)
5. Add log sampling for high-volume scenarios
6. Add structured error stack traces
