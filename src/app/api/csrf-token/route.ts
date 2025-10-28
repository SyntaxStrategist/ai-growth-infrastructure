import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken } from '../../../lib/security';

export async function GET(req: NextRequest) {
  try {
    // Generate a new CSRF token
    const csrfToken = generateCSRFToken();
    
    return NextResponse.json({
      success: true,
      csrfToken,
      message: 'CSRF token generated successfully'
    });
  } catch (error) {
    console.error('[CSRF Token] Error generating token:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate CSRF token' },
      { status: 500 }
    );
  }
}

export const runtime = "edge";
