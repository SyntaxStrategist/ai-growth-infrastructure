'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { getTranslation } from '../translations/prospect-intelligence';

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
  // Detect locale directly from URL path
  const pathname = usePathname?.() || '';
  const locale = pathname.startsWith('/fr') ? 'fr' : 'en';
  
  // Debug logging
  console.log('🌍 Email Preview Locale:', locale);
  console.log('🌍 Current Pathname:', pathname);
  const [sending, setSending] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [editingEmail, setEditingEmail] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  
  const t = (key: string) => getTranslation(locale, key as never);

  useEffect(() => {
    if (isOpen) {
      console.log('[EmailPreview] Opening for prospect:', prospect.business_name);
      console.log('[EmailPreview] Loaded contact_email:', prospect.contact_email || 'null');
      
      if (!prospect.contact_email) {
        console.warn('[EmailPreview] ⚠️  No contact email available for this prospect');
        setEditingEmail(true); // Auto-open email editor if no email
      } else {
        setEditingEmail(false);
        setManualEmail('');
      }
      
      setEmailError('');
      generateEmailContent();
    }

    return () => {
      if (!isOpen) {
        console.log('[EmailPreview] Closed');
        setEditingEmail(false);
        setManualEmail('');
        setEmailError('');
      }
    };
  }, [isOpen, prospect, locale]);

  const generateEmailContent = () => {
    // Import at runtime to avoid SSR issues
    const { generateBrandedEmailTemplate, getEmailSubject } = require('../lib/email/branded_templates');
    
    console.log('[EmailPreview] Generating email content for locale:', locale);
    
    // Generate branded email template with locale
    const template = generateBrandedEmailTemplate({
      business_name: prospect.business_name,
      industry: prospect.industry,
      website: prospect.website
    }, locale);
    
    const subject = getEmailSubject(prospect.business_name, locale);

    console.log('[EmailPreview] Email subject:', subject);
    console.log('[EmailPreview] Email language:', locale === 'fr' ? 'French' : 'English');

    setEmailSubject(subject);
    // Use HTML template for display, will send both HTML and text
    setEmailBody(template.html);
  };

  const handleSaveEmail = async () => {
    // Validate email
    const emailToSave = manualEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(emailToSave)) {
      setEmailError(t('invalidEmailFormat'));
      return;
    }

    console.log('[EmailPreview] Saving manual email:', emailToSave);
    setEmailError('');

    try {
      // Save email to Supabase
      const response = await fetch('/api/prospect-intelligence/prospects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: prospect.id,
          contact_email: emailToSave,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to save email');
      }

      console.log('[EmailPreview] ✅ Email saved to Supabase');
      
      // Update local prospect object
      prospect.contact_email = emailToSave;
      setEditingEmail(false);
      setManualEmail('');
      
    } catch (err) {
      console.error('[EmailPreview] ❌ Error saving email:', err);
      setEmailError(err instanceof Error ? err.message : 'Failed to save email');
    }
  };

  const handleSend = async () => {
    if (testMode) {
      onSendError(t('testModeSendDisabled'));
      return;
    }

    const emailToUse = prospect.contact_email || manualEmail.trim();
    
    if (!emailToUse) {
      onSendError(`No contact email found for ${prospect.business_name}`);
      return;
    }

    // Validate email before sending
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToUse)) {
      onSendError('Invalid email format. Please enter a valid email address.');
      return;
    }

    setSending(true);
    console.log('[EmailPreview] Sending email to:', emailToUse);

    try {
      const response = await fetch('/api/prospect-intelligence/outreach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prospect_id: prospect.id,
          to: emailToUse,
          subject: emailSubject,
          htmlBody: emailBody,
          textBody: emailBody, // Will be converted server-side
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to send email');
      }

      console.log('[EmailPreview] ✅ Email sent successfully');
      console.log('[EmailPreview] Message ID:', data.data?.messageId);
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
              📧 {t('emailPreview')}
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
                <p className="text-yellow-300 font-medium">{t('testModeWarning')}</p>
                <p className="text-yellow-300/70 text-sm mt-1">
                  {t('testModeSendDisabled')}
                </p>
              </div>
            )}

            {/* Recipient */}
            <div className={`rounded-lg p-4 ${prospect.contact_email && !editingEmail ? 'bg-white/5' : 'bg-yellow-500/10 border border-yellow-500/30'}`}>
              <p className="text-sm text-white/50 mb-1">{t('to')}:</p>
              
              {prospect.contact_email && !editingEmail ? (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {prospect.contact_email}
                      </p>
                      <p className="text-sm text-white/70 mt-1">
                        {prospect.business_name} • {prospect.industry}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingEmail(true);
                        setManualEmail(prospect.contact_email || '');
                      }}
                      className="text-xs text-blue-400 hover:text-blue-300 ml-2"
                    >
                      {t('editEmail')}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-yellow-300 font-medium mb-2">
                    {prospect.contact_email ? t('editingEmail') : t('addEmail')}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={manualEmail}
                      onChange={(e) => {
                        setManualEmail(e.target.value);
                        setEmailError('');
                      }}
                      placeholder="email@example.com"
                      className="flex-1 px-3 py-2 rounded bg-white/10 border border-white/20 text-white placeholder:text-white/30 focus:border-blue-400 focus:outline-none text-sm"
                    />
                    <button
                      onClick={handleSaveEmail}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium transition-colors"
                    >
                      {t('save')}
                    </button>
                    {prospect.contact_email && (
                      <button
                        onClick={() => {
                          setEditingEmail(false);
                          setManualEmail('');
                          setEmailError('');
                        }}
                        className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-sm transition-colors"
                      >
                        {t('cancel')}
                      </button>
                    )}
                  </div>
                  {emailError && (
                    <p className="text-red-400 text-xs mt-2">❌ {emailError}</p>
                  )}
                  <p className="text-xs text-yellow-300/70 mt-2">
                    {prospect.business_name} • {prospect.industry}
                  </p>
                </>
              )}
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

            {/* Body Preview */}
            <div>
              <label className="block text-sm text-white/70 mb-2">Message Preview</label>
              
              {/* Security Notice for External Links */}
              <div className="mb-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-blue-300 text-xs flex items-center gap-2">
                  <span>🔗</span>
                  <span>The demo dashboard link opens in a new tab for security. Recipients will see the full branded email.</span>
                </p>
              </div>
              
              <div className="bg-white rounded-lg border border-white/20 overflow-hidden">
                <iframe
                  srcDoc={emailBody}
                  title="Email Preview"
                  className="w-full h-[500px] border-0"
                  sandbox="allow-scripts allow-same-origin allow-popups allow-top-navigation allow-popups-to-escape-sandbox"
                  onLoad={(e) => {
                    // Add click handler for demo links
                    try {
                      const iframe = e.currentTarget;
                      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
                      if (iframeDoc) {
                        const demoLinks = iframeDoc.querySelectorAll('a[href*="demo"]');
                        demoLinks.forEach((link) => {
                          const href = link.getAttribute('href');
                          console.log('[EmailPreviewModal] Opening demo link:', href);
                          link.addEventListener('click', (event) => {
                            event.preventDefault();
                            console.log('[EmailPreviewModal] Demo link clicked:', href);
                            if (href) {
                              window.open(href, '_blank', 'noopener,noreferrer');
                            }
                          });
                        });
                      }
                    } catch (err) {
                      console.warn('[EmailPreviewModal] Could not attach demo link handlers:', err);
                    }
                  }}
                />
              </div>
              <p className="text-xs text-white/50 mt-2">
                ℹ️ Preview shows the branded HTML email template that will be sent
              </p>
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
              {t('cancel')}
            </button>
            <button
              onClick={handleSend}
              disabled={sending || testMode || !prospect.contact_email}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              title={!prospect.contact_email ? t('noContactEmailAvailable') : (testMode ? t('testModeWarning') : t('sendEmail'))}
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('sending')}
                </>
              ) : (
                <>
                  ✉️ {t('sendNow')}
                  {!prospect.contact_email && <span className="text-xs">({t('noEmail')})</span>}
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

