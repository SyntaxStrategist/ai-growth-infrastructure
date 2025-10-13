"use client";

import { useState } from "react";
import { useTranslations, useLocale } from 'next-intl';
import { AvenirLogo } from "../../components/AvenirLogo";
import { LanguageToggle } from "../../components/LanguageToggle";

type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export default function Home() {
  const t = useTranslations();
  const locale = useLocale();
  const [input, setInput] = useState("");
  const [assistantReply, setAssistantReply] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leadAsked, setLeadAsked] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [leadMessage, setLeadMessage] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setError(null);
    setAssistantReply("");

    const messages: ChatMessage[] = [
      { role: "system", content: t('ai.systemPrompt', { language: locale === 'fr' ? 'français' : 'English' }) },
      { role: "user", content: input.trim() },
    ];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      const data = await res.json();
      const content: string = data?.message?.content || "";
      setAssistantReply(content);
      // After the first successful assistant reply, prompt for lead info
      setLeadAsked(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('chat.error');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-8 sm:p-20 flex items-start justify-center">
      <main className="w-full max-w-3xl flex flex-col gap-10">
        {/* Language Toggle */}
        <div className="flex justify-end">
          <LanguageToggle />
        </div>

        <section className="flex flex-col gap-4 text-center items-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/20 px-3 py-1 text-xs font-medium">
            {t('hero.badge')}
          </div>
          <div className="flex items-center gap-3">
            <AvenirLogo className="h-10 w-10" />
            <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">
              {t('hero.title')}
            </h1>
          </div>
          <p className="text-base sm:text-lg text-black/70 dark:text-white/70 max-w-2xl">
            {t('hero.subtitle')}
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold">{t('chat.title')}</h2>
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              aria-label="Your message"
              className="flex-1 rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2"
              placeholder={t('chat.placeholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="rounded-md px-4 py-2 bg-black text-white dark:bg-white dark:text-black disabled:opacity-50"
              disabled={loading}
            >
              {loading ? t('chat.sending') : t('chat.send')}
            </button>
          </form>

          {error && (
            <div className="text-sm text-red-600" role="alert">
              {error}
            </div>
          )}

          {assistantReply && (
            <div className="rounded-md border border-black/10 dark:border-white/20 p-4 whitespace-pre-wrap">
              {assistantReply}
            </div>
          )}

          {leadAsked && !leadSubmitted && (
            <form
              className="mt-2 flex flex-col gap-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                if (!name.trim() || !email.trim() || !leadMessage.trim()) {
                  setError(t('lead.validation.required'));
                  return;
                }
                const emailOk = /.+@.+\..+/.test(email.trim());
                if (!emailOk) {
                  setError(t('lead.validation.email'));
                  return;
                }
                try {
                  const res = await fetch("/api/lead", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: name.trim(),
                      email: email.trim(),
                      message: leadMessage.trim(),
                      timestamp: new Date().toISOString(),
                      locale: locale,
                    }),
                  });
                  if (!res.ok) {
                    const d = await res.json().catch(() => ({}));
                    throw new Error(d?.error || `Failed to save lead (${res.status})`);
                  }
                  setLeadSubmitted(true);
                  setName("");
                  setEmail("");
                  setLeadMessage("");
                } catch (err) {
                  const msg = err instanceof Error ? err.message : "Failed to save lead";
                  setError(msg);
                }
              }}
            >
              <div className="text-sm opacity-80">
                {t('lead.prompt')}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  className="flex-1 rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2"
                  placeholder={t('lead.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  className="flex-1 rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2"
                  placeholder={t('lead.emailPlaceholder')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <textarea
                  className="flex-1 rounded-md border border-black/10 dark:border-white/20 bg-transparent px-3 py-2 min-h-[80px]"
                  placeholder={t('lead.messagePlaceholder')}
                  value={leadMessage}
                  onChange={(e) => setLeadMessage(e.target.value)}
                />
                <button
                  type="submit"
                  className="rounded-md px-4 py-2 bg-black text-white dark:bg-white dark:text-black"
                >
                  {t('lead.submit')}
                </button>
              </div>
            </form>
          )}

          {leadSubmitted && (
            <div className="text-sm mt-2 text-green-600">
              {t('lead.success')}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
