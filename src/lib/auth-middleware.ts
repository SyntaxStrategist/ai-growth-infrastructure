import { NextRequest, NextResponse } from 'next/server';

export function verifyAdminAuth(req: NextRequest): boolean {
  // Check for admin authentication in various ways
  
  // 1. Check for admin_auth in localStorage (handled client-side)
  // 2. Check for admin session token in headers
  const adminToken = req.headers.get('x-admin-token');
  if (adminToken && adminToken === process.env.ADMIN_SESSION_TOKEN) {
    return true;
  }
  
  // 3. Check for API key with admin privileges
  const apiKey = req.headers.get('x-api-key');
  if (apiKey && apiKey === process.env.ADMIN_API_KEY) {
    return true;
  }
  
  // 4. For development, allow if no auth is configured
  if (process.env.NODE_ENV === 'development' && !process.env.ADMIN_SESSION_TOKEN && !process.env.ADMIN_API_KEY) {
    console.warn('[AuthMiddleware] Development mode: Admin auth not configured, allowing access');
    return true;
  }
  
  return false;
}

export function withAdminAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    // Skip auth check for certain endpoints
    const url = new URL(req.url);
    const publicEndpoints = [
      '/api/auth-dashboard',
      '/api/health',
      '/api/cron/daily-outreach-report' // Cron jobs use different auth
    ];
    
    if (publicEndpoints.some(endpoint => url.pathname.startsWith(endpoint))) {
      return handler(req);
    }
    
    // Check admin authentication
    if (!verifyAdminAuth(req)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Admin authentication required",
          code: "ADMIN_AUTH_REQUIRED"
        },
        { status: 401 }
      );
    }
    
    return handler(req);
  };
}

export function verifyCronAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  
  // For development, allow if no cron secret is configured
  if (process.env.NODE_ENV === 'development' && !cronSecret) {
    console.warn('[AuthMiddleware] Development mode: Cron secret not configured, allowing access');
    return true;
  }
  
  return false;
}

export function withCronAuth(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    if (!verifyCronAuth(req)) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Cron authentication required",
          code: "CRON_AUTH_REQUIRED"
        },
        { status: 401 }
      );
    }
    
    return handler(req);
  };
}
