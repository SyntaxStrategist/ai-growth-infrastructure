import { NextResponse } from 'next/server';

/**
 * Centralized error handler for API routes
 * Provides consistent error logging and response formatting
 * 
 * @param err - The error object (unknown type for flexibility)
 * @param context - Context string to identify where the error occurred
 * @returns NextResponse with standardized error format
 */
export function handleApiError(err: unknown, context: string): NextResponse {
  // Extract error information
  const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
  const errorType = err instanceof Error ? err.constructor.name : typeof err;
  const errorStack = err instanceof Error ? err.stack : 'No stack trace available';
  
  // Create standardized log format
  const logMessage = `[${context}] ❌ API Error`;
  const logDetails = {
    type: errorType,
    message: errorMessage,
    stack: errorStack,
    timestamp: new Date().toISOString(),
    context: context
  };
  
  // Log error with consistent format
  console.error('='.repeat(60));
  console.error(logMessage);
  console.error('='.repeat(60));
  console.error('Error Type:', errorType);
  console.error('Error Message:', errorMessage);
  console.error('Context:', context);
  console.error('Timestamp:', logDetails.timestamp);
  console.error('Stack Trace:', errorStack);
  console.error('Full Error Object:', err);
  console.error('='.repeat(60));
  
  // Return consistent JSON response
  return NextResponse.json(
    { 
      success: false, 
      error: errorMessage 
    },
    { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json' 
      }
    }
  );
}
