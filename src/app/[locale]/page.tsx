"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from 'next-intl';
import { motion, useScroll, useTransform } from 'framer-motion';
import AvenirLogo from "../../components/AvenirLogo";
import { LanguageToggle } from "../../components/LanguageToggle";
import BridgeAnimation from "../../components/BridgeAnimation";

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
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const logoGlow = useTransform(scrollYProgress, [0, 0.2], [0.5, 1]);

  useEffect(() => {
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

    return () => {
      observer.disconnect();
    };
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
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }

        @keyframes glowPulse {
          0%, 100% { filter: blur(40px); opacity: 0.3; }
          50% { filter: blur(50px); opacity: 0.5; }
        }

        .logo-glow {
          position: relative;
        }

        .logo-glow::before {
          content: '';
          position: absolute;
          inset: -30px;
          background: radial-gradient(circle, rgba(0, 191, 255, 0.25) 0%, rgba(139, 92, 246, 0.15) 50%, transparent 70%);
          z-index: -1;
          animation: glowPulse 4s ease-in-out infinite;
        }

        .cta-glow {
          position: relative;
          overflow: hidden;
        }

        .cta-glow::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 191, 255, 0.4), transparent);
          transform: translate(-50%, -50%);
          transition: width 0.6s ease, height 0.6s ease;
          pointer-events: none;
        }

        .cta-glow:hover::after {
          width: 300px;
          height: 300px;
        }

        .section-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0, 191, 255, 0.3), transparent);
          filter: blur(0.5px);
        }

        .letter-spacing-wide {
          letter-spacing: 0.05em;
        }

        .framework-card {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
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
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }

        .card-hover:hover {
          transform: translateY(-6px);
          box-shadow: 0 0 30px rgba(0, 191, 255, 0.25), 0 0 60px rgba(139, 92, 246, 0.15);
          border-color: rgba(0, 191, 255, 0.5);
        }
      `}</style>
      <main className="w-full max-w-3xl flex flex-col gap-10">
        {/* Language Toggle */}
        <div className="flex justify-end">
          <LanguageToggle />
        </div>

        <section className="flex flex-col gap-8 text-center items-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/20 px-3 py-1 text-xs font-medium"
          >
            {t('hero.badge')}
          </motion.div>
          
          <div className="flex flex-col items-center gap-6">
            <motion.div
              className="logo-glow"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              style={{ opacity: logoGlow }}
            >
              <AvenirLogo locale={locale} showText={false} className="scale-125 sm:scale-150" />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              className="text-2xl sm:text-4xl font-bold tracking-tighter text-center max-w-4xl leading-tight"
            >
              {t('hero.title')}
            </motion.h1>
          </div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="text-base sm:text-lg text-black/60 dark:text-white/60 max-w-3xl font-light leading-relaxed"
          >
            {t('hero.subtitle')}
          </motion.p>
        </section>

        <div className="section-divider my-4"></div>

        {/* Bridge Animation */}
        <section className="py-20">
          <BridgeAnimation locale={locale} />
        </section>

        <section className="flex flex-col gap-6 mt-8">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-2xl font-semibold text-center letter-spacing-wide"
          >
            {t('framework.title')}
          </motion.h2>
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

        <div className="section-divider my-4"></div>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-8 relative"
        >
          {/* Blur gradient background for depth */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-transparent blur-3xl opacity-30"></div>
          
          <div className="flex flex-col items-center gap-2">
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-center letter-spacing-wide"
            >
              {t('demo.title')}
            </motion.h2>
            <p className="text-sm text-gray-400">
              {t('demo.subtitle')}
            </p>
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent mt-2"></div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {(t.raw('demo.examples') as any[]).map((demo, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                whileHover={{ 
                  y: -4,
                  boxShadow: "0 0 40px rgba(0, 191, 255, 0.15), 0 0 80px rgba(139, 92, 246, 0.1)"
                }}
                className="rounded-lg border border-black/10 dark:border-white/20 p-5 bg-gradient-to-br from-blue-50/5 to-purple-50/5 hover:border-blue-400/40 transition-all cursor-pointer"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-black/50 dark:text-white/50 text-xs">{t('demo.fields.name')}</span>
                    <p className="font-medium">{demo.name}</p>
                  </div>
                  <div>
                    <span className="text-black/50 dark:text-white/50 text-xs">{t('demo.fields.intent')}</span>
                    <p className="font-medium text-blue-400">{demo.intent}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-black/50 dark:text-white/50 text-xs">{t('demo.fields.message')}</span>
                    <p className="text-black/70 dark:text-white/70 italic">&quot;{demo.message}&quot;</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-black/50 dark:text-white/50 text-xs">{t('demo.fields.summary')}</span>
                    <p className="text-black/80 dark:text-white/80">{demo.summary}</p>
                  </div>
                  <div>
                    <span className="text-black/50 dark:text-white/50 text-xs">{t('demo.fields.tone')}</span>
                    <p>{demo.tone}</p>
                  </div>
                  <div>
                    <span className="text-black/50 dark:text-white/50 text-xs">{t('demo.fields.urgency')}</span>
                    <p className={
                      (demo.urgency === 'High' || demo.urgency === 'Élevée') ? 'text-red-400 font-semibold' : 
                      (demo.urgency === 'Medium' || demo.urgency === 'Moyenne') ? 'text-yellow-400' : 
                      'text-green-400'
                    }>
                      {demo.urgency}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-black/50 dark:text-white/50 text-xs">{t('demo.fields.confidence')}</span>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${demo.confidence * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: idx * 0.1 + 0.3, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        ></motion.div>
                      </div>
                      <span className="text-xs font-mono">{(demo.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <div className="section-divider my-4"></div>

        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex flex-col gap-4 text-center"
        >
          <div className="max-w-4xl mx-auto">
            <p className="text-lg sm:text-xl text-blue-400 dark:text-blue-300 font-medium leading-relaxed tracking-wide">
              {t('positioning.tagline')}
            </p>
          </div>
        </motion.section>

        <div className="section-divider my-8"></div>

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
            className="cta-glow rounded-md px-4 py-2 bg-black text-white dark:bg-white dark:text-black disabled:opacity-50 transition-all"
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
                setIsSubmittingLead(true);
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
                } finally {
                  setIsSubmittingLead(false);
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
                  disabled={isSubmittingLead}
                  className="cta-glow rounded-md px-4 py-2 bg-black text-white dark:bg-white dark:text-black disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {isSubmittingLead && (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSubmittingLead 
                    ? (locale === 'fr' ? 'Envoi…' : 'Sending…')
                    : t('lead.submit')
                  }
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

        <div className="section-divider my-12"></div>

        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center py-8"
        >
          <p className="text-sm text-black/50 dark:text-white/50 font-light tracking-wide">
            Avenir AI Solutions — Building intelligent infrastructures that think and grow.
          </p>
        </motion.footer>
      </main>
    </div>
  );
}
