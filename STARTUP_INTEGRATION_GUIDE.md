# Startup Integration Guide

## Overview

The `checkEnv()` function has been successfully integrated into the Avenir AI project to run once at server startup. This integration ensures environment variables are validated early without impacting performance or running on every API call.

## Integration Architecture

### 1. Startup Utility (`src/lib/startup.ts`)
- **Singleton Pattern**: Ensures startup tasks run only once per server instance
- **Cached Results**: Returns cached results on subsequent calls
- **Comprehensive Logging**: Uses centralized logger for all output
- **Error Handling**: Graceful error handling without crashing the application

### 2. Health Check Endpoint (`src/app/api/health/route.ts`)
- **Trigger Point**: Runs startup initialization on first call
- **Health Status**: Provides comprehensive server health information
- **Environment Status**: Includes environment variable check results
- **Performance Metrics**: Server uptime, memory usage, response times

## How It Works

### First API Call Flow:
1. **Health Check Called**: `/api/health` endpoint is accessed
2. **Startup Check**: `isStartupInitialized()` returns `false`
3. **Environment Check**: `checkEnv()` runs and logs all results
4. **Results Cached**: Startup results are stored for future calls
5. **Health Response**: Comprehensive health status returned

### Subsequent API Calls:
1. **Health Check Called**: `/api/health` endpoint is accessed
2. **Startup Check**: `isStartupInitialized()` returns `true`
3. **Cached Results**: Previously cached startup results are used
4. **Health Response**: Health status returned (no environment re-check)

## Usage Examples

### Basic Health Check
```bash
# Check server health and trigger startup initialization
curl http://localhost:3000/api/health

# Response includes environment status
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:45.123Z",
  "responseTime": "15ms",
  "startup": {
    "initialized": true,
    "timestamp": "2024-01-20T10:30:45.100Z",
    "environment": {
      "allPresent": true,
      "totalChecked": 9,
      "totalPresent": 9,
      "criticalMissing": 0,
      "optionalMissing": 0
    }
  },
  "server": {
    "uptime": 123.45,
    "nodeVersion": "v18.17.0",
    "platform": "darwin",
    "memory": {
      "used": 45,
      "total": 128,
      "unit": "MB"
    }
  }
}
```

### Health Check with POST
```bash
# POST request with additional parameters
curl -X POST http://localhost:3000/api/health \
  -H "Content-Type: application/json" \
  -d '{"checkDatabase": true, "checkExternalServices": true}'
```

### Programmatic Usage
```typescript
import { initializeStartup, getStartupResults } from '@/lib/startup';

// In any API route or server code
export async function GET() {
  // Ensure startup is completed
  if (!isStartupInitialized()) {
    await initializeStartup();
  }
  
  // Get startup results
  const results = getStartupResults();
  
  if (results?.envCheck?.allPresent) {
    // All environment variables are present
    return NextResponse.json({ status: 'ready' });
  } else {
    // Some environment variables are missing
    return NextResponse.json({ 
      status: 'degraded',
      missing: results?.envCheck?.criticalMissing 
    });
  }
}
```

## Environment Variable Status

### Healthy Status
- **All Required Variables Present**: `status: "healthy"`
- **Some Optional Missing**: `status: "warning"`
- **Critical Variables Missing**: `status: "degraded"`

### Logging Output
```
[2024-01-20T10:30:45.123Z] [INFO] 🚀 Starting server initialization...
[2024-01-20T10:30:45.124Z] [INFO] 🔍 Running environment variable check...
[2024-01-20T10:30:45.125Z] [INFO] ✅ NEXT_PUBLIC_SUPABASE_URL: https://****.supabase.co
[2024-01-20T10:30:45.126Z] [INFO] ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9****
[2024-01-20T10:30:45.127Z] [INFO] ✅ SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9****
[2024-01-20T10:30:45.128Z] [INFO] ✅ SECONDARY_DB_URL: postgresql://****
[2024-01-20T10:30:45.129Z] [INFO] ✅ OPENAI_API_KEY: sk-****
[2024-01-20T10:30:45.130Z] [INFO] 📊 Environment check summary: { totalChecked: 9, totalPresent: 9, criticalMissing: 0, optionalMissing: 0, allRequiredPresent: true }
[2024-01-20T10:30:45.131Z] [INFO] ✅ All required environment variables present
[2024-01-20T10:30:45.132Z] [INFO] ✅ Server initialization completed successfully
```

## Key Benefits

### 1. **Performance Optimized**
- Runs only once per server instance
- Cached results for subsequent calls
- No impact on API response times

### 2. **Early Detection**
- Environment issues detected at first API call
- Prevents runtime failures from missing variables
- Clear logging for debugging

### 3. **Production Ready**
- Safe error handling
- Comprehensive health monitoring
- Structured logging for observability

### 4. **Developer Friendly**
- Easy to test and debug
- Clear status indicators
- Detailed error reporting

## Monitoring and Alerting

### Health Check Endpoints
- **GET /api/health**: Basic health check
- **POST /api/health**: Advanced health check with parameters

### Status Codes
- **200**: Server is running (regardless of environment status)
- **500**: Server error (startup failure)

### Health Status Values
- **healthy**: All systems operational
- **warning**: Optional features may be limited
- **degraded**: Critical functionality may be affected

## Integration Points

### Automatic Integration
- **First API Call**: Startup runs automatically
- **Health Monitoring**: Built-in health check endpoint
- **Logging**: Centralized logging for all startup activities

### Manual Integration
- **Custom Endpoints**: Import and use startup utilities
- **Server Initialization**: Call `initializeStartup()` manually
- **Status Checking**: Use `getStartupResults()` for status

## Testing

### Local Testing
```bash
# Start the development server
npm run dev

# Test health endpoint
curl http://localhost:3000/api/health

# Check logs for startup messages
```

### Production Testing
```bash
# Test health endpoint in production
curl https://your-domain.com/api/health

# Monitor logs for startup completion
```

## Troubleshooting

### Common Issues
1. **Startup Not Running**: Check if `/api/health` has been called
2. **Missing Variables**: Check logs for specific missing variables
3. **Performance Issues**: Verify startup only runs once

### Debug Commands
```typescript
import { isStartupInitialized, getStartupResults } from '@/lib/startup';

// Check if startup has run
console.log('Startup initialized:', isStartupInitialized());

// Get startup results
const results = getStartupResults();
console.log('Environment check results:', results?.envCheck);
```

## Security Considerations

- **Sensitive Data**: Environment variable values are masked in logs
- **Health Endpoint**: Safe to expose publicly (no sensitive data)
- **Error Handling**: No sensitive information leaked in error responses

The startup integration provides a robust, performant, and production-ready solution for environment variable validation that runs once at server startup and provides comprehensive health monitoring capabilities.
