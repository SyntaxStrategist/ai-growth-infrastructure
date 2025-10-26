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
    
    console.log('[ApproveClient] Approving client:', clientId);
    
    // Update client status to 'active'
    const { data, error } = await supabase
      .from('clients')
      .update({ status: 'active' })
      .eq('client_id', clientId)
      .select()
      .single();
    
    if (error) {
      console.error('[ApproveClient] ❌ Error approving client:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to approve client' },
        { status: 500 }
      );
    }
    
    console.log('[ApproveClient] ✅ Client approved:', clientId);
    
    // TODO: Send approval email to client
    // This would notify them that their account is now active
    
    return NextResponse.json({
      success: true,
      message: 'Client approved successfully',
      data,
    });
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}
