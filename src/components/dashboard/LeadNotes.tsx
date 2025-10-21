"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale } from 'next-intl';

interface LeadNote {
  id: string;
  lead_id: string;
  client_id?: string;
  note: string;
  performed_by: string;
  created_at: string;
  updated_at: string;
}

interface LeadNotesProps {
  leadId: string;
  clientId?: string;
  isFrench: boolean;
  className?: string;
}

export default function LeadNotes({ leadId, clientId, isFrench, className = "" }: LeadNotesProps) {
  const [notes, setNotes] = useState<LeadNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const locale = useLocale();

  const translations = {
    title: isFrench ? 'Notes' : 'Notes',
    addNote: isFrench ? 'Ajouter une note' : 'Add Note',
    noNotes: isFrench ? 'Aucune note pour le moment' : 'No notes yet',
    save: isFrench ? 'Enregistrer' : 'Save',
    cancel: isFrench ? 'Annuler' : 'Cancel',
    edit: isFrench ? 'Modifier' : 'Edit',
    delete: isFrench ? 'Supprimer' : 'Delete',
    confirmDelete: isFrench ? 'Êtes-vous sûr de vouloir supprimer cette note ?' : 'Are you sure you want to delete this note?',
    confirm: isFrench ? 'Confirmer' : 'Confirm',
    loading: isFrench ? 'Chargement...' : 'Loading...',
    error: isFrench ? 'Erreur lors du chargement des notes' : 'Error loading notes',
    noteAdded: isFrench ? 'Note ajoutée avec succès' : 'Note added successfully',
    noteUpdated: isFrench ? 'Note mise à jour avec succès' : 'Note updated successfully',
    noteDeleted: isFrench ? 'Note supprimée avec succès' : 'Note deleted successfully',
    addNoteError: isFrench ? 'Erreur lors de l\'ajout de la note' : 'Error adding note',
    updateNoteError: isFrench ? 'Erreur lors de la mise à jour de la note' : 'Error updating note',
    deleteNoteError: isFrench ? 'Erreur lors de la suppression de la note' : 'Error deleting note',
    expand: isFrench ? 'Afficher les notes' : 'Show Notes',
    collapse: isFrench ? 'Masquer les notes' : 'Hide Notes',
  };

  // Fetch notes
  const fetchNotes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({ lead_id: leadId });
      if (clientId) {
        params.append('client_id', clientId);
      }
      
      const response = await fetch(`/api/lead-notes?${params}`);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || translations.error);
      }
      
      setNotes(result.data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
      setError(err instanceof Error ? err.message : translations.error);
    } finally {
      setLoading(false);
    }
  };

  // Add new note
  const addNote = async () => {
    if (!newNote.trim()) return;
    
    try {
      setIsAdding(true);
      
      const response = await fetch('/api/lead-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          client_id: clientId,
          note: newNote.trim(),
          performed_by: 'admin', // This should come from session in real implementation
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || translations.addNoteError);
      }
      
      setNewNote('');
      await fetchNotes(); // Refresh the list
    } catch (err) {
      console.error('Error adding note:', err);
      setError(err instanceof Error ? err.message : translations.addNoteError);
    } finally {
      setIsAdding(false);
    }
  };

  // Update note
  const updateNote = async (noteId: string) => {
    if (!editingText.trim()) return;
    
    try {
      const response = await fetch(`/api/lead-notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          note: editingText.trim(),
          performed_by: 'admin', // This should come from session in real implementation
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || translations.updateNoteError);
      }
      
      setEditingId(null);
      setEditingText('');
      await fetchNotes(); // Refresh the list
    } catch (err) {
      console.error('Error updating note:', err);
      setError(err instanceof Error ? err.message : translations.updateNoteError);
    }
  };

  // Delete note
  const deleteNote = async (noteId: string) => {
    try {
      const response = await fetch(`/api/lead-notes/${noteId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || translations.deleteNoteError);
      }
      
      setDeletingId(null);
      await fetchNotes(); // Refresh the list
    } catch (err) {
      console.error('Error deleting note:', err);
      setError(err instanceof Error ? err.message : translations.deleteNoteError);
    }
  };

  // Start editing
  const startEditing = (note: LeadNote) => {
    setEditingId(note.id);
    setEditingText(note.note);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditingText('');
  };

  // Format relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (isFrench) {
      if (diffMins < 1) return 'À l\'instant';
      if (diffMins < 60) return `Il y a ${diffMins} min`;
      if (diffHours < 24) return `Il y a ${diffHours} h`;
      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else {
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    }
  };

  // Load notes on mount
  useEffect(() => {
    if (leadId) {
      fetchNotes();
    }
  }, [leadId, clientId]);

  if (loading) {
    return (
      <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/30"></div>
          <span className="ml-3 text-white/70">{translations.loading}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium text-lg">{translations.title}</h3>
        <div className="flex items-center gap-3">
          <span className="text-white/60 text-sm">{notes.length}</span>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 text-sm transition-colors"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
            {isExpanded ? translations.collapse : translations.expand}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg"
              >
                <p className="text-red-300 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Add new note */}
            <div className="mb-6">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder={translations.addNote}
                className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                rows={3}
                disabled={isAdding}
              />
              <div className="flex justify-end mt-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={addNote}
                  disabled={!newNote.trim() || isAdding}
                  className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg text-sm hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAdding ? translations.loading : translations.addNote}
                </motion.button>
              </div>
            </div>

            {/* Notes list */}
            <div className="space-y-3">
              <AnimatePresence>
                {notes.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-8"
                  >
                    <div className="text-4xl mb-2">📝</div>
                    <p className="text-white/60">{translations.noNotes}</p>
                  </motion.div>
                ) : (
                  notes.map((note, index) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="bg-white/5 border border-white/10 rounded-lg p-4"
                    >
                      {editingId === note.id ? (
                        // Edit mode
                        <div className="space-y-3">
                          <textarea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent"
                            rows={3}
                          />
                          <div className="flex justify-end gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={cancelEditing}
                              className="px-3 py-2 bg-gray-500/20 text-gray-300 rounded-lg text-sm hover:bg-gray-500/30 transition-colors"
                            >
                              {translations.cancel}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => updateNote(note.id)}
                              disabled={!editingText.trim()}
                              className="px-3 py-2 bg-green-500/20 text-green-300 rounded-lg text-sm hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {translations.save}
                            </motion.button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div>
                          <p className="text-white/90 text-sm leading-relaxed mb-3">{note.note}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs text-white/60">
                              <span>{note.performed_by}</span>
                              <span>•</span>
                              <span>{formatRelativeTime(note.created_at)}</span>
                            </div>
                            <div className="flex gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => startEditing(note)}
                                className="p-2 text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                                title={translations.edit}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setDeletingId(note.id)}
                                className="p-2 text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                                title={translations.delete}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setDeletingId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-white font-medium text-lg mb-3">{translations.delete}</h3>
              <p className="text-white/70 text-sm mb-6">{translations.confirmDelete}</p>
              <div className="flex justify-end gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDeletingId(null)}
                  className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg text-sm hover:bg-gray-500/30 transition-colors"
                >
                  {translations.cancel}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => deleteNote(deletingId)}
                  className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                >
                  {translations.confirm}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
