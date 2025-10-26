import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { handleApiError } from '../../../../lib/error-handler';

export async function GET(req: NextRequest) {
  try {
    console.log('[AdminApprovals] Fetching pending client approvals...');
    
    // Get clients with pending_approval status
    const { data: clients, error } = await supabase
      .from('clients')
      .select('id, client_id, business_name, contact_name, email, industry_category, primary_service, created_at, status')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('[AdminApprovals] ❌ Error fetching pending clients:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch pending clients' },
        { status: 500 }
      );
    }
    
    console.log('[AdminApprovals] ✅ Found', clients?.length || 0, 'pending clients');
    
    return NextResponse.json({
      success: true,
      data: clients || [],
    });
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}
