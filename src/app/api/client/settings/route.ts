import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const clientId = req.nextUrl.searchParams.get('clientId');
    
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID required' },
        { status: 400 }
      );
    }
    
    console.log('[ClientSettings] Fetching settings for client:', clientId);
    
    const { data, error } = await supabase
      .from('clients')
      .select('industry_category, primary_service, booking_link, custom_tagline, email_tone, followup_speed, ai_personalized_reply, language, business_name')
      .eq('client_id', clientId)
      .single();
    
    if (error) {
      console.error('[ClientSettings] ❌ Fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch settings' },
        { status: 500 }
      );
    }
    
    console.log('[ClientSettings] ✅ Settings fetched successfully');
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('[ClientSettings] ❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clientId,
      industryCategory,
      primaryService,
      bookingLink,
      customTagline,
      emailTone,
      followupSpeed,
      language,
      aiPersonalizedReply,
    } = body;
    
    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID required' },
        { status: 400 }
      );
    }
    
    console.log('[ClientSettings] Updating settings for client:', clientId);
    console.log('[ClientSettings] New values:', {
      industry: industryCategory,
      service: primaryService,
      tone: emailTone,
      speed: followupSpeed,
    });
    
    // Validate email tone
    const validTones = ['Professional', 'Friendly', 'Formal', 'Energetic'];
    if (emailTone && !validTones.includes(emailTone)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email tone' },
        { status: 400 }
      );
    }
    
    // Validate followup speed
    const validSpeeds = ['Instant', 'Within 1 hour', 'Same day'];
    if (followupSpeed && !validSpeeds.includes(followupSpeed)) {
      return NextResponse.json(
        { success: false, error: 'Invalid follow-up speed' },
        { status: 400 }
      );
    }
    
    // Build update object
    const updateData: any = {};
    
    if (industryCategory !== undefined) updateData.industry_category = industryCategory;
    if (primaryService !== undefined) updateData.primary_service = primaryService;
    if (bookingLink !== undefined) updateData.booking_link = bookingLink || null;
    if (customTagline !== undefined) updateData.custom_tagline = customTagline || null;
    if (emailTone !== undefined) updateData.email_tone = emailTone;
    if (followupSpeed !== undefined) updateData.followup_speed = followupSpeed;
    if (language !== undefined) updateData.language = language;
    if (aiPersonalizedReply !== undefined) updateData.ai_personalized_reply = aiPersonalizedReply;
    
    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('client_id', clientId)
      .select()
      .single();
    
    if (error) {
      console.error('[ClientSettings] ❌ Update error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update settings' },
        { status: 500 }
      );
    }
    
    console.log('[ClientSettings] ✅ Settings updated successfully');
    return NextResponse.json({ success: true, data });
    
  } catch (error) {
    console.error('[ClientSettings] ❌ Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

