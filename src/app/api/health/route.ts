/**
 * Health Check API Endpoint
 * 
 * Provides server health status and runs startup initialization on first call.
 * This endpoint is safe to call frequently and will only run startup tasks once.
 */

import { NextRequest, NextResponse } from 'next/server';
import { initializeStartup, getStartupResults, isStartupInitialized } from '@/lib/startup';
import { logInfo, logWarn } from '@/lib/logger';
import { handleApiError } from '@/lib/error-handler';

/**
 * GET /api/health
 * 
 * Returns server health status and ensures startup tasks are completed.
 * Startup tasks (like environment variable checks) run only once per server instance.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const startTime = Date.now();
    
    // Ensure startup tasks are completed (runs only once)
    if (!isStartupInitialized()) {
      logInfo('🏥 Health check triggered startup initialization');
      await initializeStartup();
    }
    
    // Get startup results
    const startupResults = getStartupResults();
    const responseTime = Date.now() - startTime;
    
    // Build health status
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      startup: {
        initialized: isStartupInitialized(),
        timestamp: startupResults?.timestamp || null,
        environment: startupResults?.envCheck ? {
          allPresent: startupResults.envCheck.allPresent,
          totalChecked: startupResults.envCheck.totalChecked,
          totalPresent: startupResults.envCheck.totalPresent,
          criticalMissing: startupResults.envCheck.criticalMissing.length,
          optionalMissing: startupResults.envCheck.optionalMissing.length
        } : null
      },
      server: {
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        }
      }
    };
    
    // Determine overall health status
    if (startupResults?.envCheck && !startupResults.envCheck.allPresent) {
      if (startupResults.envCheck.criticalMissing.length > 0) {
        healthStatus.status = 'degraded';
        logWarn('🏥 Health check: Server is degraded due to missing critical environment variables');
      } else {
        healthStatus.status = 'warning';
        logWarn('🏥 Health check: Server has warnings due to missing optional environment variables');
      }
    }
    
    logInfo('🏥 Health check completed', {
      status: healthStatus.status,
      responseTime: `${responseTime}ms`,
      envStatus: healthStatus.startup.environment?.allPresent ? 'OK' : 'ISSUES'
    });
    
    return NextResponse.json(healthStatus, { 
      status: healthStatus.status === 'healthy' ? 200 : 200 // Always return 200, use status field for actual health
    });
    
  } catch (error) {
    logWarn('🏥 Health check failed', { error });
    return handleApiError(error, 'Health Check');
  }
}

/**
 * POST /api/health
 * 
 * Alternative endpoint for health checks that require POST method.
 * Same functionality as GET but allows for more complex health check requests.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body for additional health check parameters
    let requestBody = {};
    try {
      const body = await req.text();
      if (body) {
        requestBody = JSON.parse(body);
      }
    } catch (parseError) {
      // Ignore parse errors, use empty object
    }
    
    // Run the same health check logic as GET
    const getResponse = await GET(req);
    const healthData = await getResponse.json();
    
    // Add request-specific information
    healthData.request = {
      method: 'POST',
      body: requestBody,
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    };
    
    return NextResponse.json(healthData, { 
      status: healthData.status === 'healthy' ? 200 : 200
    });
    
  } catch (error) {
    return handleApiError(error, 'Health Check POST');
  }
}
