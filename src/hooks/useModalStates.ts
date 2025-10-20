import { useState, useCallback } from 'react';

export type ReversionReason = 'accident' | 'other';

export function useModalStates() {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmPermanentDelete, setConfirmPermanentDelete] = useState<string | null>(null);
  const [tagLead, setTagLead] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isTagging, setIsTagging] = useState(false);
  const [revertLead, setRevertLead] = useState<string | null>(null);
  const [reversionReason, setReversionReason] = useState<ReversionReason>('accident');
  const [customReversionReason, setCustomReversionReason] = useState<string>('');

  const openDeleteModal = useCallback((leadId: string) => {
    setConfirmDelete(leadId);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setConfirmDelete(null);
  }, []);

  const openPermanentDeleteModal = useCallback((leadId: string) => {
    setConfirmPermanentDelete(leadId);
  }, []);

  const closePermanentDeleteModal = useCallback(() => {
    setConfirmPermanentDelete(null);
  }, []);

  const openTagModal = useCallback((leadId: string) => {
    setTagLead(leadId);
    setSelectedTag('');
  }, []);

  const closeTagModal = useCallback(() => {
    setTagLead(null);
    setSelectedTag('');
    setIsTagging(false);
  }, []);

  const openRevertModal = useCallback((leadId: string) => {
    setRevertLead(leadId);
    setReversionReason('accident');
    setCustomReversionReason('');
  }, []);

  const closeRevertModal = useCallback(() => {
    setRevertLead(null);
    setReversionReason('accident');
    setCustomReversionReason('');
  }, []);

  return {
    // Delete modals
    confirmDelete,
    setConfirmDelete,
    confirmPermanentDelete,
    setConfirmPermanentDelete,
    openDeleteModal,
    closeDeleteModal,
    openPermanentDeleteModal,
    closePermanentDeleteModal,
    
    // Tag modal
    tagLead,
    setTagLead,
    selectedTag,
    setSelectedTag,
    isTagging,
    setIsTagging,
    openTagModal,
    closeTagModal,
    
    // Revert modal
    revertLead,
    setRevertLead,
    reversionReason,
    setReversionReason,
    customReversionReason,
    setCustomReversionReason,
    openRevertModal,
    closeRevertModal,
  };
}
