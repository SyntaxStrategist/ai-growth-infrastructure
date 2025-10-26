import { NextRequest, NextResponse } from 'next/server';
import { sendUrgentLeadAlert } from '../../../lib/email-alerts';

/**
 * Test endpoint for email alerts
 * Use this to test if email alerts work properly
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[TestEmailAlert] Testing email alert system...');
    
    // Get test parameters from request
    const body = await req.json();
    const { clientId, testEmail } = body;
    
    if (!clientId || !testEmail) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Client ID and test email are required' 
        },
        { status: 400 }
      );
    }
    
    // Create a test lead
    const testLead = {
      id: 'test-lead-' + Date.now(),
      name: 'Test Lead - Sarah Johnson',
      email: 'test@example.com',
      message: 'I need a quote for a kitchen renovation. We want to start in 2 weeks and have a $25,000 budget. This is urgent.',
      aiSummary: 'High-value kitchen renovation request with confirmed budget and urgent timeline.',
      intent: 'Quote Request',
      urgency: 'High',
      confidence_score: 0.92,
      clientId: clientId,
      timestamp: new Date().toISOString(),
    };
    
    console.log('[TestEmailAlert] Sending test alert...');
    await sendUrgentLeadAlert(testLead);
    
    return NextResponse.json({
      success: true,
      message: 'Test email alert sent successfully!',
      sentTo: testEmail,
    });
    
  } catch (error) {
    console.error('[TestEmailAlert] Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

