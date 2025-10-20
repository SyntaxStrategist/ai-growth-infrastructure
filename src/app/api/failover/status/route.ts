import { NextRequest, NextResponse } from 'next/server';
import { getFailoverStatus, forceHealthCheck } from '../../../../lib/failover';

import { handleApiError } from '../../../../lib/error-handler';
/**
 * GET /api/failover/status
 * Returns current failover status and health information
 */
export async function GET(req: NextRequest) {
  try {
    const status = getFailoverStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        ...status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      }
    });
  } catch (error) {
    return handleApiError(error, 'API');
  }
}

/**
 * POST /api/failover/status
 * Forces a health check and returns updated status
 */
export async function POST(req: NextRequest) {
  try {
    const healthCheck = await forceHealthCheck();
    const status = getFailoverStatus();
    
    return NextResponse.json({
      success: true,
      data: {
        healthCheck,
        status: {
          ...status,
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        }
      }
    });
  } catch (error) {
    return handleApiError(error, 'API');
  }
}
