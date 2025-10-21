/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../lib/supabase";
import { randomUUID } from "crypto";

import { handleApiError } from '../../../lib/error-handler';

// POST /api/lead-notes - Add a new note
export async function POST(req: NextRequest) {
  try {
    const { lead_id, client_id, note, performed_by } = await req.json();

    console.log(`[LeadNotes] POST received - lead_id: ${lead_id}, client_id: ${client_id}`);

    if (!lead_id || !note || !note.trim()) {
      console.error('[LeadNotes] Missing required fields');
      return NextResponse.json(
        { success: false, message: "lead_id and note are required" },
        { status: 400 }
      );
    }

    // Validate that lead exists
    const { data: leadData, error: leadError } = await supabase
      .from('lead_memory')
      .select('id, client_id')
      .eq('id', lead_id)
      .single();

    if (leadError || !leadData) {
      console.error('[LeadNotes] Lead not found:', lead_id);
      return NextResponse.json(
        { success: false, message: "Lead not found" },
        { status: 404 }
      );
    }

    // If client_id provided, validate it exists and matches the lead's client
    if (client_id) {
      // Fetch client data to get the public client_id
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, client_id')
        .eq('id', client_id)
        .single();

      if (clientError || !clientData) {
        console.error('[LeadNotes] Client not found:', client_id);
        return NextResponse.json(
          { success: false, message: "Client not found" },
          { status: 404 }
        );
      }

      // Verify the lead belongs to this client (use public client_id for comparison)
      const publicClientId = clientData.client_id;
      if (leadData.client_id !== publicClientId) {
        console.error('[LeadNotes] Lead does not belong to client:', { 
          lead_id, 
          client_uuid: client_id, 
          client_public_id: publicClientId,
          lead_client_id: leadData.client_id 
        });
        return NextResponse.json(
          { success: false, message: "Lead does not belong to this client" },
          { status: 403 }
        );
      }
      
      console.log('[LeadNotes] ✅ Client ownership verified (POST):', {
        client_uuid: client_id,
        public_client_id: publicClientId,
        lead_client_id: leadData.client_id
      });
    }

    // Create the note
    const noteId = randomUUID();
    
    // Handle client_id properly - only set it if it exists in the clients table
    let finalClientId = null;
    if (client_id) {
      finalClientId = client_id;
    } else if (leadData.client_id) {
      // Verify the lead's client_id exists in the clients table
      const { data: clientExists } = await supabase
        .from('clients')
        .select('id')
        .eq('id', leadData.client_id)
        .single();
      
      if (clientExists) {
        finalClientId = leadData.client_id;
      }
    }
    
    const noteRecord = {
      id: noteId,
      lead_id,
      client_id: finalClientId,
      note: note.trim(),
      performed_by: performed_by || 'admin',
    };

    console.log('[LeadNotes] Creating note:', noteRecord);

    const { data: createdNote, error: createError } = await supabase
      .from('lead_notes')
      .insert(noteRecord)
      .select()
      .single();

    if (createError) {
      console.error('[LeadNotes] Failed to create note:', createError);
      return NextResponse.json(
        { success: false, message: "Error creating note", error: createError.message },
        { status: 500 }
      );
    }

    // Log the action to lead_actions table
    const actionId = randomUUID();
    const actionRecord = {
      id: actionId,
      lead_id,
      client_id: finalClientId,
      action_type: 'note_added',
      tag: 'Note Added',
    };

    console.log('[LeadNotes] Logging note_added action:', actionRecord);

    const { error: actionError } = await supabase
      .from('lead_actions')
      .insert(actionRecord);

    if (actionError) {
      console.error('[LeadNotes] Failed to log note_added action:', actionError);
      // Don't fail the request if logging fails - the note was created successfully
    } else {
      console.log('[LeadNotes] ✅ Note added action logged successfully');
    }

    console.log('[LeadNotes] ✅ Note created successfully:', createdNote.id);
    return NextResponse.json({ 
      success: true, 
      message: 'Note added successfully',
      data: createdNote 
    });
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}

// GET /api/lead-notes - Fetch notes for a lead
export async function GET(req: NextRequest) {
  try {
    console.log('[LeadNotes] GET /api/lead-notes triggered');
    
    const url = new URL(req.url);
    const lead_id = url.searchParams.get('lead_id');
    const client_id = url.searchParams.get('client_id');
    
    console.log('[LeadNotes] Query params:', {
      lead_id: lead_id || 'not provided',
      client_id: client_id || 'not provided',
    });

    if (!lead_id) {
      return NextResponse.json(
        { success: false, message: "lead_id is required" },
        { status: 400 }
      );
    }

    // Validate that lead exists
    const { data: leadData, error: leadError } = await supabase
      .from('lead_memory')
      .select('id, client_id')
      .eq('id', lead_id)
      .single();

    if (leadError || !leadData) {
      console.error('[LeadNotes] Lead not found:', lead_id);
      return NextResponse.json(
        { success: false, message: "Lead not found" },
        { status: 404 }
      );
    }

    // If client_id provided, validate it and verify the lead belongs to this client
    if (client_id) {
      // Fetch client data to get the public client_id
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id, client_id')
        .eq('id', client_id)
        .single();

      if (clientError || !clientData) {
        console.error('[LeadNotes] Client not found:', client_id);
        return NextResponse.json(
          { success: false, message: "Client not found" },
          { status: 404 }
        );
      }

      // Verify the lead belongs to this client (use public client_id for comparison)
      const publicClientId = clientData.client_id;
      if (leadData.client_id !== publicClientId) {
        console.error('[LeadNotes] Lead does not belong to client:', { 
          lead_id, 
          client_uuid: client_id, 
          client_public_id: publicClientId,
          lead_client_id: leadData.client_id 
        });
        return NextResponse.json(
          { success: false, message: "Lead does not belong to this client" },
          { status: 403 }
        );
      }
      
      console.log('[LeadNotes] ✅ Client ownership verified:', {
        client_uuid: client_id,
        public_client_id: publicClientId,
        lead_client_id: leadData.client_id
      });
    }

    // Fetch notes for the lead
    const query = supabase
      .from('lead_notes')
      .select('*')
      .eq('lead_id', lead_id)
      .order('created_at', { ascending: false });

    // If client_id provided, filter by client
    if (client_id) {
      query.eq('client_id', client_id);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[LeadNotes] Failed to fetch notes:', error);
      return NextResponse.json(
        { success: false, message: "Error fetching notes", error: error.message },
        { status: 500 }
      );
    }

    console.log('[LeadNotes] ✅ Found', data?.length || 0, 'notes for lead:', lead_id);
    return NextResponse.json({ success: true, data: data || [] });
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}
