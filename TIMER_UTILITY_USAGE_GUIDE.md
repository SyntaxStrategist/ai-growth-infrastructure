# Timer Utility Usage Guide

## Overview

The `src/lib/timer.ts` utility provides production-safe timing functionality for measuring execution time of async operations without affecting business logic. It uses the centralized logger for all output and includes comprehensive error handling.

## Core Functions

### 1. `timeExecution(label, fn)` - Main Async Timer

**Purpose**: Measure execution time of async functions with automatic logging.

```typescript
import { timeExecution } from '@/lib/timer';

// Basic usage
const result = await timeExecution('Database Query', async () => {
  return await supabase.from('leads').select('*');
});

// With error handling
const result = await timeExecution('API Call', async () => {
  const response = await fetch('/api/external-service');
  if (!response.ok) throw new Error('API call failed');
  return response.json();
});
```

**Log Output**:
```
[2024-01-20T10:30:45.123Z] [INFO] [⏱️ Timer Start] Database Query
[2024-01-20T10:30:45.456Z] [INFO] [✅ Timer End] Database Query - Duration: 333ms
```

### 2. `startTimer(label)` & `endTimer(label)` - Manual Timing

**Purpose**: Manual timing for non-async operations or custom timing scenarios.

```typescript
import { startTimer, endTimer } from '@/lib/timer';

// Start timing
startTimer('Data Processing');

// ... do some work ...
const processedData = processLargeDataset(data);

// End timing
const duration = endTimer('Data Processing');
console.log(`Processing took ${duration}ms`);
```

**Log Output**:
```
[2024-01-20T10:30:45.123Z] [INFO] [⏱️ Timer Start] Data Processing
[2024-01-20T10:30:45.456Z] [INFO] [✅ Timer End] Data Processing - Duration: 333ms
```

### 3. `timeSyncExecution(label, fn)` - Sync Function Timer

**Purpose**: Measure execution time of synchronous functions.

```typescript
import { timeSyncExecution } from '@/lib/timer';

const result = timeSyncExecution('Data Validation', () => {
  return validateUserInput(inputData);
});
```

## Advanced Features

### 4. Timer Management Functions

```typescript
import { 
  getTimerDuration, 
  isTimerActive, 
  getActiveTimers, 
  clearAllTimers 
} from '@/lib/timer';

// Check if a timer is running
if (isTimerActive('Long Operation')) {
  const currentDuration = getTimerDuration('Long Operation');
  console.log(`Operation has been running for ${currentDuration}ms`);
}

// Get all active timers
const activeTimers = getActiveTimers();
console.log('Active timers:', activeTimers);

// Clear all timers (useful for cleanup)
clearAllTimers();
```

### 5. Performance Timer Object

```typescript
import { createPerformanceTimer } from '@/lib/timer';

const perfTimer = createPerformanceTimer('Complex Operation');

// Start timing
perfTimer.start();

// ... do work ...

// Check current duration without ending
const currentDuration = perfTimer.getDuration();

// End timing
const finalDuration = perfTimer.end();
```

### 6. Class Method Decorator

```typescript
import { timer } from '@/lib/timer';

class DataService {
  @timer('DataService.fetchUserData')
  async fetchUserData(userId: string) {
    // This method will be automatically timed
    return await this.database.getUser(userId);
  }
  
  @timer() // Uses method name automatically
  async processData(data: any[]) {
    // Timer label will be "DataService.processData"
    return data.map(item => this.transform(item));
  }
}
```

## Real-World Usage Examples

### API Route Timing

```typescript
// src/app/api/leads/route.ts
import { timeExecution } from '@/lib/timer';
import { handleApiError } from '@/lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    const leads = await timeExecution('Fetch Leads', async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    });
    
    return NextResponse.json({ success: true, leads });
    
  } catch (error) {
    return handleApiError(error, 'Leads API');
  }
}
```

### Database Operation Timing

```typescript
// src/lib/database.ts
import { timeExecution } from '@/lib/timer';

export async function createLead(leadData: LeadData) {
  return await timeExecution('Create Lead', async () => {
    const { data, error } = await supabase
      .from('leads')
      .insert(leadData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  });
}

export async function updateLeadStatus(leadId: string, status: string) {
  return await timeExecution('Update Lead Status', async () => {
    const { data, error } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', leadId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  });
}
```

### External API Call Timing

```typescript
// src/lib/external-apis.ts
import { timeExecution } from '@/lib/timer';

export async function callOpenAI(prompt: string) {
  return await timeExecution('OpenAI API Call', async () => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    return response.json();
  });
}
```

### Complex Operation Timing

```typescript
// src/lib/lead-processing.ts
import { timeExecution, startTimer, endTimer } from '@/lib/timer';

export async function processLead(lead: Lead) {
  // Time the entire operation
  return await timeExecution('Process Lead', async () => {
    // Time individual steps
    const enrichedLead = await timeExecution('Enrich Lead Data', async () => {
      return await enrichWithExternalData(lead);
    });
    
    const analyzedLead = await timeExecution('Analyze Lead Intent', async () => {
      return await analyzeIntent(enrichedLead);
    });
    
    // Manual timing for sync operations
    startTimer('Generate Summary');
    const summary = generateSummary(analyzedLead);
    endTimer('Generate Summary');
    
    return {
      ...analyzedLead,
      summary
    };
  });
}
```

### Performance Monitoring

```typescript
// src/lib/performance-monitor.ts
import { createPerformanceTimer } from '@/lib/timer';

export class PerformanceMonitor {
  private timers = new Map<string, ReturnType<typeof createPerformanceTimer>>();
  
  startOperation(operationId: string, label: string) {
    const timer = createPerformanceTimer(label);
    timer.start();
    this.timers.set(operationId, timer);
  }
  
  endOperation(operationId: string) {
    const timer = this.timers.get(operationId);
    if (timer) {
      const duration = timer.end();
      this.timers.delete(operationId);
      return duration;
    }
    return null;
  }
  
  getOperationDuration(operationId: string) {
    const timer = this.timers.get(operationId);
    return timer?.getDuration() || null;
  }
}
```

## Error Handling

The timer utility is designed to never affect business logic, even if timing fails:

```typescript
// If timing fails, the original function still executes
const result = await timeExecution('Risky Operation', async () => {
  // This will still run even if timing fails
  return await riskyOperation();
});

// Errors in the timed function are properly propagated
try {
  const result = await timeExecution('Failing Operation', async () => {
    throw new Error('Operation failed');
  });
} catch (error) {
  // Error is caught and logged, then re-thrown
  console.log('Caught error:', error.message);
}
```

**Error Log Output**:
```
[2024-01-20T10:30:45.123Z] [INFO] [⏱️ Timer Start] Failing Operation
[2024-01-20T10:30:45.456Z] [ERROR] [❌ Timer Error] Failing Operation - Duration: 333ms
```

## Best Practices

### 1. Use Descriptive Labels
```typescript
// Good
await timeExecution('Database Query - Fetch User Leads', async () => {
  return await supabase.from('leads').select('*').eq('user_id', userId);
});

// Bad
await timeExecution('Query', async () => {
  return await supabase.from('leads').select('*').eq('user_id', userId);
});
```

### 2. Time at the Right Level
```typescript
// Good - Time the entire operation
export async function processLead(lead: Lead) {
  return await timeExecution('Process Lead', async () => {
    const enriched = await enrichLead(lead);
    const analyzed = await analyzeLead(enriched);
    return await saveLead(analyzed);
  });
}

// Good - Time individual steps if needed
export async function processLead(lead: Lead) {
  const enriched = await timeExecution('Enrich Lead', async () => {
    return await enrichLead(lead);
  });
  
  const analyzed = await timeExecution('Analyze Lead', async () => {
    return await analyzeLead(enriched);
  });
  
  return await timeExecution('Save Lead', async () => {
    return await saveLead(analyzed);
  });
}
```

### 3. Clean Up Manual Timers
```typescript
// Good - Always end timers
startTimer('Long Operation');
try {
  await longOperation();
} finally {
  endTimer('Long Operation');
}

// Better - Use try/finally for cleanup
const timer = createPerformanceTimer('Long Operation');
timer.start();
try {
  await longOperation();
} finally {
  timer.end();
}
```

### 4. Use for Performance Monitoring
```typescript
// Monitor slow operations
const result = await timeExecution('Slow Database Query', async () => {
  return await supabase.rpc('complex_aggregation');
});

// Log warnings for slow operations
if (duration > 5000) {
  logWarn('Slow operation detected', { operation: 'Slow Database Query', duration });
}
```

## Integration with Existing Code

The timer utility integrates seamlessly with existing code without requiring changes to business logic:

```typescript
// Before
export async function getLeads() {
  const { data, error } = await supabase.from('leads').select('*');
  if (error) throw error;
  return data;
}

// After - Just wrap with timer
export async function getLeads() {
  return await timeExecution('Get Leads', async () => {
    const { data, error } = await supabase.from('leads').select('*');
    if (error) throw error;
    return data;
  });
}
```

## TypeScript Safety

The timer utility is fully TypeScript-safe and preserves return types:

```typescript
// Return type is preserved
const leads: Lead[] = await timeExecution('Get Leads', async (): Promise<Lead[]> => {
  return await supabase.from('leads').select('*');
});

// Generic types work correctly
const result = await timeExecution('Generic Operation', async () => {
  return { success: true, data: 'test' };
});
// result is inferred as { success: boolean; data: string }
```

The timer utility provides comprehensive, production-safe timing functionality that enhances observability without affecting application behavior.
