"use client";

import { useState, useEffect, useRef } from "react";
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
  const [isVisible, setIsVisible] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
          }
        });
      },
      { threshold: 0.1 }
    );

    if (cardsRef.current) {
      const cards = cardsRef.current.querySelectorAll('.framework-card');
      cards.forEach((card) => observer.observe(card));
    }

    return () => observer.disconnect();
  }, []);

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
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .hero-animate {
          animation: fadeIn 0.8s ease-out forwards;
        }

        .hero-text-animate {
          animation: fadeInUp 1s ease-out 0.2s forwards;
          opacity: 0;
        }

        .framework-card {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.4s ease-out;
        }

        .framework-card.animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        .framework-card:nth-child(1).animate-in { transition-delay: 0.1s; }
        .framework-card:nth-child(2).animate-in { transition-delay: 0.2s; }
        .framework-card:nth-child(3).animate-in { transition-delay: 0.3s; }
        .framework-card:nth-child(4).animate-in { transition-delay: 0.4s; }

        .card-hover {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 0 20px rgba(0, 191, 255, 0.3);
          border-color: rgba(0, 191, 255, 0.4);
        }

        .logo-glow {
          position: relative;
        }

        .logo-glow::before {
          content: '';
          position: absolute;
          inset: -20px;
          background: radial-gradient(circle, rgba(0, 191, 255, 0.2) 0%, transparent 70%);
          z-index: -1;
          animation: pulse 3s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
      `}</style>
      <main className="w-full max-w-3xl flex flex-col gap-10">
        {/* Language Toggle */}
        <div className="flex justify-end">
          <LanguageToggle />
        </div>

        <section className="flex flex-col gap-6 text-center items-center">
          <div className={`inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/20 px-3 py-1 text-xs font-medium ${isVisible ? 'hero-animate' : 'opacity-0'}`}>
            {t('hero.badge')}
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className={`logo-glow ${isVisible ? 'hero-animate' : 'opacity-0'}`}>
              <AvenirLogo className="h-14 w-14 sm:h-16 sm:w-16 max-w-[80px] sm:max-w-[120px]" />
            </div>
            <h1 className={`text-3xl sm:text-5xl font-semibold tracking-tight text-center ${isVisible ? 'hero-text-animate' : 'opacity-0'}`}>
              {t('hero.title')}
            </h1>
          </div>
          <p className={`text-base sm:text-lg text-black/70 dark:text-white/70 max-w-3xl ${isVisible ? 'hero-text-animate' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
            {t('hero.subtitle')}
          </p>
        </section>

        <section className="flex flex-col gap-6 mt-8">
          <h2 className="text-2xl font-semibold text-center">{t('framework.title')}</h2>
          <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="framework-card card-hover rounded-lg border border-black/10 dark:border-white/20 p-6 bg-gradient-to-br from-blue-50/5 to-purple-50/5">
              <h3 className="text-lg font-semibold mb-2">{t('framework.cards.acquisition.title')}</h3>
              <p className="text-sm text-black/70 dark:text-white/70">{t('framework.cards.acquisition.description')}</p>
            </div>
            <div className="framework-card card-hover rounded-lg border border-black/10 dark:border-white/20 p-6 bg-gradient-to-br from-blue-50/5 to-purple-50/5">
              <h3 className="text-lg font-semibold mb-2">{t('framework.cards.conversion.title')}</h3>
              <p className="text-sm text-black/70 dark:text-white/70">{t('framework.cards.conversion.description')}</p>
            </div>
            <div className="framework-card card-hover rounded-lg border border-black/10 dark:border-white/20 p-6 bg-gradient-to-br from-blue-50/5 to-purple-50/5">
              <h3 className="text-lg font-semibold mb-2">{t('framework.cards.retention.title')}</h3>
              <p className="text-sm text-black/70 dark:text-white/70">{t('framework.cards.retention.description')}</p>
            </div>
            <div className="framework-card card-hover rounded-lg border border-black/10 dark:border-white/20 p-6 bg-gradient-to-br from-blue-50/5 to-purple-50/5">
              <h3 className="text-lg font-semibold mb-2">{t('framework.cards.operational.title')}</h3>
              <p className="text-sm text-black/70 dark:text-white/70">{t('framework.cards.operational.description')}</p>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4 text-center">
          <div className="max-w-4xl mx-auto">
            <p className="text-lg sm:text-xl text-blue-400 dark:text-blue-300 font-medium leading-relaxed">
              {t('positioning.tagline')}
            </p>
          </div>
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
