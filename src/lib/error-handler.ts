import { NextResponse } from 'next/server';

/**
 * Centralized error handler for API routes
 * Provides consistent error logging and response formatting
 * 
 * @param err - The error object (unknown type for flexibility)
 * @param context - Context string to identify where the error occurred
 * @param origin - Optional origin for CORS headers
 * @returns NextResponse with standardized error format
 */
export function handleApiError(err: unknown, context: string, origin?: string | null): NextResponse {
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
  
  // CORS headers for localhost and production
  const allowedOrigins = [
    'https://www.aveniraisolutions.ca',
    'https://aveniraisolutions.ca',
    'http://localhost:3000',
    'http://localhost:8000',
    'http://localhost:8001',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:3000',
  ];
  
  const corsOrigin = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  
  // Return consistent JSON response
  return NextResponse.json(
    { 
      success: false, 
      error: errorMessage 
    },
    { 
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
      }
    }
  );
}
