# Environment Variable Checker Usage Examples

## Basic Usage

```typescript
import { checkEnv } from '@/lib/env-check';

// Check all required environment variables
const result = checkEnv();

if (result.allPresent) {
  console.log('All environment variables are configured correctly');
} else {
  console.log('Some environment variables are missing:', result.criticalMissing);
}
```

## Integration in API Routes

```typescript
// In any API route file
import { checkEnv } from '@/lib/env-check';

export async function GET() {
  // Check environment variables at startup
  const envCheck = checkEnv();
  
  if (!envCheck.allPresent) {
    // Log warning but don't crash
    console.warn('Some environment variables are missing');
  }
  
  // Continue with API logic...
}
```

## Integration in Server Startup

```typescript
// In your main server file or middleware
import { checkEnv } from '@/lib/env-check';

// Run environment check on server startup
export function initializeServer() {
  const envCheck = checkEnv();
  
  if (envCheck.allPresent) {
    console.log('✅ Server initialized with all required environment variables');
  } else {
    console.warn('⚠️ Server initialized with missing environment variables');
  }
  
  return envCheck;
}
```

## Check Specific Variables

```typescript
import { checkSpecificEnvVars } from '@/lib/env-check';

// Check only specific environment variables
const result = checkSpecificEnvVars([
  'NEXT_PUBLIC_SUPABASE_URL',
  'OPENAI_API_KEY'
]);

console.log('Present:', result.present);
console.log('Missing:', result.missing);
```

## Get Environment Variable Status

```typescript
import { getEnvVarStatus } from '@/lib/env-check';

// Get detailed status of a specific variable
const status = getEnvVarStatus('SUPABASE_SERVICE_ROLE_KEY');

console.log('Present:', status.present);
console.log('Masked Value:', status.maskedValue);
console.log('Length:', status.length);
```

## Example Output

When all variables are present:
```
[2024-01-20T10:30:45.123Z] [INFO] 🔍 Starting environment variable check...
[2024-01-20T10:30:45.124Z] [INFO] 📋 Checking required environment variables:
[2024-01-20T10:30:45.125Z] [INFO] ✅ NEXT_PUBLIC_SUPABASE_URL: https://****.supabase.co
[2024-01-20T10:30:45.126Z] [INFO] ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9****
[2024-01-20T10:30:45.127Z] [INFO] ✅ SUPABASE_SERVICE_ROLE_KEY: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9****
[2024-01-20T10:30:45.128Z] [INFO] ✅ SECONDARY_DB_URL: postgresql://****
[2024-01-20T10:30:45.129Z] [INFO] ✅ OPENAI_API_KEY: sk-****
[2024-01-20T10:30:45.130Z] [INFO] 📊 Environment check summary: { totalChecked: 9, totalPresent: 9, criticalMissing: 0, optionalMissing: 0, allRequiredPresent: true }
[2024-01-20T10:30:45.131Z] [INFO] ✅ All required environment variables present
```

When some variables are missing:
```
[2024-01-20T10:30:45.123Z] [INFO] 🔍 Starting environment variable check...
[2024-01-20T10:30:45.124Z] [INFO] 📋 Checking required environment variables:
[2024-01-20T10:30:45.125Z] [INFO] ✅ NEXT_PUBLIC_SUPABASE_URL: https://****.supabase.co
[2024-01-20T10:30:45.126Z] [ERROR] ❌ SUPABASE_SERVICE_ROLE_KEY: Missing
[2024-01-20T10:30:45.127Z] [WARN] ❌ OPENAI_API_KEY: Missing
[2024-01-20T10:30:45.128Z] [INFO] 📊 Environment check summary: { totalChecked: 9, totalPresent: 7, criticalMissing: 1, optionalMissing: 1, allRequiredPresent: false }
[2024-01-20T10:30:45.129Z] [ERROR] ❌ Critical environment variables missing: { missing: ['SUPABASE_SERVICE_ROLE_KEY'], impact: 'Application functionality may be severely limited' }
[2024-01-20T10:30:45.130Z] [WARN] ⚠️ Optional environment variables missing: { missing: ['OPENAI_API_KEY'], impact: 'Some features may be unavailable' }
```

## Integration with Error Handler

```typescript
import { checkEnv } from '@/lib/env-check';
import { handleApiError } from '@/lib/error-handler';

export async function POST(req: NextRequest) {
  try {
    // Check environment variables first
    const envCheck = checkEnv();
    
    if (!envCheck.allPresent && envCheck.criticalMissing.length > 0) {
      // Log the issue but don't crash
      console.warn('Critical environment variables missing, but continuing...');
    }
    
    // Your API logic here...
    
  } catch (error) {
    return handleApiError(error, 'API Route');
  }
}
```

## Default Export Usage

```typescript
import checkEnv from '@/lib/env-check';

// Use default export
const result = checkEnv();
```

## Key Features

- **Safe**: Never throws errors or crashes the application
- **Detailed Logging**: Uses centralized logger with structured output
- **Security**: Masks sensitive values in logs (shows first 4 and last 4 characters)
- **Flexible**: Can check all variables or specific ones
- **TypeScript Safe**: Fully typed with proper interfaces
- **Production Ready**: Designed for use in production environments
