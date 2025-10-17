'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Prospect {
  id: string;
  business_name: string;
  website: string;
  contact_email?: string;
  industry: string;
}

interface EmailPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: Prospect;
  testMode: boolean;
  onSendSuccess: () => void;
  onSendError: (error: string) => void;
}

export default function EmailPreviewModal({
  isOpen,
  onClose,
  prospect,
  testMode,
  onSendSuccess,
  onSendError
}: EmailPreviewModalProps) {
  const [sending, setSending] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  useEffect(() => {
    if (isOpen) {
      console.log('[EmailPreview] Opening for prospect:', prospect.business_name);
      generateEmailContent();
    }

    return () => {
      if (!isOpen) {
        console.log('[EmailPreview] Closed');
      }
    };
  }, [isOpen, prospect]);

  const generateEmailContent = () => {
    // Generate personalized email subject
    const subject = `Streamline Operations at ${prospect.business_name}`;
    
    // Generate personalized email body
    const body = `Hello,

I noticed ${prospect.business_name} is in the ${prospect.industry} industry, and wanted to reach out about an opportunity to streamline your operations.

We specialize in AI-powered automation solutions that can help businesses like yours:
• Automate lead intake and qualification
• Reduce manual data entry by 80%
• Improve response times to customer inquiries
• Free up your team to focus on high-value tasks

I'd love to schedule a brief 15-minute call to discuss how we can help ${prospect.business_name} achieve similar results.

Would you be available for a quick chat this week?

Best regards,
Avenir AI Solutions Team

Website: ${prospect.website}
Industry: ${prospect.industry}

---
This email was sent as part of our prospect outreach program. If you'd prefer not to receive future communications, please let us know.`;

    setEmailSubject(subject);
    setEmailBody(body);
  };

  const handleSend = async () => {
    if (testMode) {
      onSendError('Cannot send emails in Test Mode. Please disable Test Mode first.');
      return;
    }

    if (!prospect.contact_email) {
      onSendError(`No contact email found for ${prospect.business_name}`);
      return;
    }

    setSending(true);
    console.log('[EmailPreview] Sending email to:', prospect.contact_email);

    try {
      const response = await fetch('/api/prospect-intelligence/outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospect_id: prospect.id,
          to: prospect.contact_email,
          subject: emailSubject,
          body: emailBody,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      console.log('[EmailPreview] ✅ Email sent successfully');
      onSendSuccess();
      onClose();
    } catch (err) {
      console.error('[EmailPreview] ❌ Error sending email:', err);
      onSendError(err instanceof Error ? err.message : 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-white/10"
        >
          {/* Header */}
          <div className="sticky top-0 bg-gray-900/95 backdrop-blur-sm border-b border-white/10 p-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              📧 Preview Email
            </h2>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
              disabled={sending}
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Test Mode Warning */}
            {testMode && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-yellow-300 font-medium">⚠️ Test Mode is ON</p>
                <p className="text-yellow-300/70 text-sm mt-1">
                  Email sending is disabled. Turn off Test Mode to send real emails.
                </p>
              </div>
            )}

            {/* Recipient */}
            <div className="bg-white/5 rounded-lg p-4">
              <p className="text-sm text-white/50 mb-1">To:</p>
              <p className="text-white font-medium">
                {prospect.contact_email || 'No email available'}
              </p>
              <p className="text-sm text-white/70 mt-1">
                {prospect.business_name} • {prospect.industry}
              </p>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm text-white/70 mb-2">Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none"
                disabled={sending}
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-sm text-white/70 mb-2">Message</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={16}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:border-purple-400 focus:outline-none font-mono text-sm"
                disabled={sending}
              />
            </div>

            {/* Variable Info */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                <strong>💡 Tip:</strong> The email has been personalized with:
              </p>
              <ul className="text-blue-300/70 text-sm mt-2 space-y-1">
                <li>• Business name: <span className="text-blue-300">{prospect.business_name}</span></li>
                <li>• Industry: <span className="text-blue-300">{prospect.industry}</span></li>
                <li>• Website: <span className="text-blue-300">{prospect.website}</span></li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-white/10 p-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
              disabled={sending}
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || testMode || !prospect.contact_email}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  ✉️ Send Now
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

