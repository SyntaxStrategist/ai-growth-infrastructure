/**
 * Email Templates API Route
 * Demonstrates proper RLS usage for outreach email templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { setClientContext, rlsOperations } from '../../../../lib/rls-helper';

export async function GET(req: NextRequest) {
  try {
    // Get client ID from query parameters or headers
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId') || req.headers.get('x-client-id');
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    console.log('[Email Templates API] Fetching templates for client:', clientId);

    // Use RLS helper to get templates with proper client context
    const templates = await rlsOperations.getEmailTemplates(clientId);

    return NextResponse.json({
      success: true,
      data: templates
    });

  } catch (error) {
    console.error('[Email Templates API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email templates' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get client ID from query parameters or headers
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId') || req.headers.get('x-client-id');
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { name, subject_template, html_template, text_template, language, category, variables } = body;

    // Validate required fields
    if (!name || !subject_template || !html_template || !text_template) {
      return NextResponse.json(
        { error: 'Missing required fields: name, subject_template, html_template, text_template' },
        { status: 400 }
      );
    }

    console.log('[Email Templates API] Creating template for client:', clientId);

    // Use RLS helper to create template with proper client context
    const template = await rlsOperations.createEmailTemplate(clientId, {
      name,
      subject_template,
      html_template,
      text_template,
      language: language || 'en',
      category: category || 'initial_outreach',
      variables: variables || []
    });

    return NextResponse.json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('[Email Templates API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create email template' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Get client ID from query parameters or headers
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId') || req.headers.get('x-client-id');
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    console.log('[Email Templates API] Updating template:', id, 'for client:', clientId);

    // Set client context for RLS
    await setClientContext(clientId);

    // Update template (RLS will ensure client can only update their own templates)
    const { data, error } = await supabase
      .from('email_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      data
    });

  } catch (error) {
    console.error('[Email Templates API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Get client ID from query parameters or headers
    const url = new URL(req.url);
    const clientId = url.searchParams.get('clientId') || req.headers.get('x-client-id');
    
    if (!clientId) {
      return NextResponse.json(
        { error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const urlParams = new URL(req.url);
    const templateId = urlParams.searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    console.log('[Email Templates API] Deleting template:', templateId, 'for client:', clientId);

    // Set client context for RLS
    await setClientContext(clientId);

    // Delete template (RLS will ensure client can only delete their own templates)
    const { error } = await supabase
      .from('email_templates')
      .delete()
      .eq('id', templateId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    });

  } catch (error) {
    console.error('[Email Templates API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete email template' },
      { status: 500 }
    );
  }
}
