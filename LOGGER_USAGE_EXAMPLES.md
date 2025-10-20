# Logger Utility Usage Examples

## Basic Usage

```typescript
import { logInfo, logWarn, logError } from '@/lib/logger';

// Simple logging
logInfo('Application started');
logWarn('Deprecated API endpoint used');
logError('Database connection failed');

// Logging with additional data
logInfo('User login successful', { userId: '123', email: 'user@example.com' });
logError('API request failed', { status: 500, url: '/api/users' });
```

## Scoped Logging

```typescript
import { createScopedLogger } from '@/lib/logger';

// Create a scoped logger for a specific module
const apiLogger = createScopedLogger('API');
const dbLogger = createScopedLogger('Database');

// Use scoped loggers
apiLogger.info('Request received', { method: 'POST', url: '/api/leads' });
dbLogger.error('Query failed', { query: 'SELECT * FROM users', error: 'Connection timeout' });
```

## Specialized Logging Functions

```typescript
import { logApiCall, logDbOperation, logPerformance } from '@/lib/logger';

// Log API calls
logApiCall('POST', '/api/leads', 201, 150); // Success
logApiCall('GET', '/api/users', 404, 50);   // Error

// Log database operations
logDbOperation('SELECT', 'users', true, 25);
logDbOperation('INSERT', 'leads', false, 100, { error: 'Duplicate key' });

// Log performance metrics
logPerformance('page_load', 1200, 'ms');
logPerformance('memory_usage', 45, 'MB');
logPerformance('active_connections', 12, 'count');
```

## Configuration Options

```typescript
import { logInfo } from '@/lib/logger';

// Custom configuration
logInfo('Message with local timestamp', null, { timestampFormat: 'local' });
logInfo('Message without timestamp', null, { includeTimestamp: false });
logInfo('Message without log level', null, { includeLogLevel: false });
```

## Default Export Usage

```typescript
import logger from '@/lib/logger';

// Use default export
logger.info('Using default export');
logger.warn('Warning message');
logger.error('Error message');

// Create scoped logger
const authLogger = logger.createScopedLogger('Auth');
authLogger.info('User authenticated');
```

## Integration with Error Handler

```typescript
import { handleApiError } from '@/lib/error-handler';
import { logError } from '@/lib/logger';

// In API routes, you can now use both
try {
  // API logic
} catch (error) {
  logError('API operation failed', { context: 'Lead API', error });
  return handleApiError(error, 'Lead API');
}
```

## Output Examples

```
[2024-01-20T10:30:45.123Z] [INFO] Application started
[2024-01-20T10:30:45.124Z] [WARN] [API] Deprecated endpoint used
[2024-01-20T10:30:45.125Z] [ERROR] [Database] Connection failed
[2024-01-20T10:30:45.126Z] [INFO] POST /api/leads → 201 (150ms)
[2024-01-20T10:30:45.127Z] [INFO] DB SELECT users → SUCCESS (25ms)
[2024-01-20T10:30:45.128Z] [INFO] PERF page_load: 1200 ms
```
