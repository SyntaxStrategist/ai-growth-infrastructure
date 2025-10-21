/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";

import { handleApiError } from '../../../../lib/error-handler';

// PATCH /api/lead-notes/[id] - Edit a note
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: noteId } = await params;
    const { note, performed_by } = await req.json();

    console.log(`[LeadNotes] PATCH received - note_id: ${noteId}`);

    if (!note || !note.trim()) {
      console.error('[LeadNotes] Note content is required');
      return NextResponse.json(
        { success: false, message: "Note content is required" },
        { status: 400 }
      );
    }

    // First, get the existing note to validate it exists and get lead_id
    const { data: existingNote, error: fetchError } = await supabase
      .from('lead_notes')
      .select('*')
      .eq('id', noteId)
      .single();

    if (fetchError || !existingNote) {
      console.error('[LeadNotes] Note not found:', noteId);
      return NextResponse.json(
        { success: false, message: "Note not found" },
        { status: 404 }
      );
    }

    // Update the note
    const { data: updatedNote, error: updateError } = await supabase
      .from('lead_notes')
      .update({
        note: note.trim(),
        performed_by: performed_by || existingNote.performed_by,
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId)
      .select()
      .single();

    if (updateError) {
      console.error('[LeadNotes] Failed to update note:', updateError);
      return NextResponse.json(
        { success: false, message: "Error updating note", error: updateError.message },
        { status: 500 }
      );
    }

    // Log the action to lead_actions table
    const actionId = crypto.randomUUID();
    const actionRecord = {
      id: actionId,
      lead_id: existingNote.lead_id,
      client_id: existingNote.client_id,
      action_type: 'note_edited',
      tag: 'Note Edited',
    };

    console.log('[LeadNotes] Logging note_edited action:', actionRecord);

    const { error: actionError } = await supabase
      .from('lead_actions')
      .insert(actionRecord);

    if (actionError) {
      console.error('[LeadNotes] Failed to log note_edited action:', actionError);
      // Don't fail the request if logging fails - the note was updated successfully
    } else {
      console.log('[LeadNotes] ✅ Note edited action logged successfully');
    }

    console.log('[LeadNotes] ✅ Note updated successfully:', updatedNote.id);
    return NextResponse.json({ 
      success: true, 
      message: 'Note updated successfully',
      data: updatedNote 
    });
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}

// DELETE /api/lead-notes/[id] - Delete a note
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: noteId } = await params;

    console.log(`[LeadNotes] DELETE received - note_id: ${noteId}`);

    // First, get the existing note to validate it exists and get lead_id
    const { data: existingNote, error: fetchError } = await supabase
      .from('lead_notes')
      .select('*')
      .eq('id', noteId)
      .single();

    if (fetchError || !existingNote) {
      console.error('[LeadNotes] Note not found:', noteId);
      return NextResponse.json(
        { success: false, message: "Note not found" },
        { status: 404 }
      );
    }

    // Delete the note
    const { error: deleteError } = await supabase
      .from('lead_notes')
      .delete()
      .eq('id', noteId);

    if (deleteError) {
      console.error('[LeadNotes] Failed to delete note:', deleteError);
      return NextResponse.json(
        { success: false, message: "Error deleting note", error: deleteError.message },
        { status: 500 }
      );
    }

    // Log the action to lead_actions table
    const actionId = crypto.randomUUID();
    const actionRecord = {
      id: actionId,
      lead_id: existingNote.lead_id,
      client_id: existingNote.client_id,
      action_type: 'note_deleted',
      tag: 'Note Deleted',
    };

    console.log('[LeadNotes] Logging note_deleted action:', actionRecord);

    const { error: actionError } = await supabase
      .from('lead_actions')
      .insert(actionRecord);

    if (actionError) {
      console.error('[LeadNotes] Failed to log note_deleted action:', actionError);
      // Don't fail the request if logging fails - the note was deleted successfully
    } else {
      console.log('[LeadNotes] ✅ Note deleted action logged successfully');
    }

    console.log('[LeadNotes] ✅ Note deleted successfully:', noteId);
    return NextResponse.json({ 
      success: true, 
      message: 'Note deleted successfully' 
    });
    
  } catch (error) {
    return handleApiError(error, 'API');
  }
}
