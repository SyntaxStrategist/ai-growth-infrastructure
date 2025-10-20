import { NextRequest, NextResponse } from 'next/server';
import { getFailoverStatus, forceHealthCheck } from '../../../../lib/failover';

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
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
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
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
