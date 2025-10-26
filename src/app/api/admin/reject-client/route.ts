import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { handleApiError } from '../../../../lib/error-handler';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId } = body;
    
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID required' },
        { status: 400 }
      );
    }
    
    console.log('[RejectClient] Rejecting client:', clientId);
    
    // Update client status to 'rejected'
    const { data, error } = await supabase
      .from('clients')
      .update({ status: 'rejected' })
      .eq('client_id', clientId)
      .select()
      .single();
    
    if (error) {
      console.error('[RejectClient] ❌ Error rejecting client:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to reject client' },
        { status: 500 }
      );
    }
    
    console.log('[RejectClient] ✅ Client rejected:', clientId);
    
    // TODO: Send rejection email to client
    // This would notify them that their account was rejected
    
    return NextResponse.json({
      success: true,
      message: 'Client rejected',
      data,
    });
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}
