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
        throw new Error(data?.error || (locale === 'fr' ? `Échec de la requête: ${res.status}` : `Request failed: ${res.status}`));
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
    <div className="min-h-screen p-6 sm:p-12 lg:p-20 flex items-start justify-center">
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
          width: 400px;
          height: 400px;
        }

        .section-divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), transparent);
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
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(59, 130, 246, 0.1);
          border-color: rgba(59, 130, 246, 0.3);
        }
      `}</style>
      <main className="w-full max-w-4xl flex flex-col gap-16">
        {/* Language Toggle */}
        <div className="flex justify-end">
          <LanguageToggle />
        </div>

        <section className="flex flex-col gap-12 text-center items-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200/50 dark:border-gray-700/50 px-4 py-2 text-sm font-semibold bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm text-gray-700 dark:text-gray-300"
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
              className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-center max-w-5xl leading-[1.1] bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent"
            >
              {t('hero.title')}
            </motion.h1>
          </div>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="text-lg sm:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl font-medium leading-relaxed text-center"
          >
            {t('hero.subtitle')}
          </motion.p>
        </section>

        <div className="section-divider my-4"></div>

        {/* Bridge Animation */}
        <section className="py-20">
          <BridgeAnimation locale={locale} />
        </section>

        <section className="flex flex-col gap-8 mt-12">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl font-bold text-center tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent"
          >
            {t('framework.title')}
          </motion.h2>
          <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="framework-card card-hover rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 bg-gradient-to-br from-blue-50/30 to-purple-50/30 dark:from-blue-950/20 dark:to-purple-950/20 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{t('framework.cards.acquisition.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t('framework.cards.acquisition.description')}</p>
            </div>
            <div className="framework-card card-hover rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 bg-gradient-to-br from-green-50/30 to-blue-50/30 dark:from-green-950/20 dark:to-blue-950/20 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{t('framework.cards.conversion.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t('framework.cards.conversion.description')}</p>
            </div>
            <div className="framework-card card-hover rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 bg-gradient-to-br from-purple-50/30 to-pink-50/30 dark:from-purple-950/20 dark:to-pink-950/20 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{t('framework.cards.retention.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t('framework.cards.retention.description')}</p>
            </div>
            <div className="framework-card card-hover rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 bg-gradient-to-br from-orange-50/30 to-red-50/30 dark:from-orange-950/20 dark:to-red-950/20 backdrop-blur-sm">
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">{t('framework.cards.operational.title')}</h3>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{t('framework.cards.operational.description')}</p>
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
              className="text-3xl sm:text-4xl font-bold text-center tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent"
            >
              {t('demo.title')}
            </motion.h2>
            <p className="text-base text-gray-500 dark:text-gray-400 font-medium">
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
                className="rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-900/80 dark:to-gray-800/80 backdrop-blur-sm hover:border-blue-400/60 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 cursor-pointer"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">{t('demo.fields.name')}</span>
                    <p className="font-semibold text-gray-900 dark:text-white mt-1">{demo.name}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">{t('demo.fields.intent')}</span>
                    <p className="font-semibold text-blue-600 dark:text-blue-400 mt-1">{demo.intent}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">{t('demo.fields.message')}</span>
                    <p className="text-gray-700 dark:text-gray-300 italic mt-1 leading-relaxed">&quot;{demo.message}&quot;</p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">{t('demo.fields.summary')}</span>
                    <p className="text-gray-800 dark:text-gray-200 mt-1 leading-relaxed">{demo.summary}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">{t('demo.fields.tone')}</span>
                    <p className="font-medium text-gray-900 dark:text-white mt-1">{demo.tone}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">{t('demo.fields.urgency')}</span>
                    <p className={`font-semibold mt-1 ${
                      (demo.urgency === 'High' || demo.urgency === 'Élevée') ? 'text-red-600 dark:text-red-400' : 
                      (demo.urgency === 'Medium' || demo.urgency === 'Moyenne') ? 'text-yellow-600 dark:text-yellow-400' : 
                      'text-green-600 dark:text-green-400'
                    }`}>
                      {demo.urgency}
                    </p>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wide">{t('demo.fields.confidence')}</span>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${demo.confidence * 100}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: idx * 0.1 + 0.3, ease: "easeOut" }}
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        ></motion.div>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">{(demo.confidence * 100).toFixed(0)}%</span>
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
            <p className="text-xl sm:text-2xl text-gray-700 dark:text-gray-300 font-semibold leading-relaxed text-center">
              {t('positioning.tagline')}
            </p>
          </div>
        </motion.section>

        <div className="section-divider my-8"></div>

        <section className="flex flex-col gap-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-center tracking-tight bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">{t('chat.title')}</h2>
          <form onSubmit={handleSend} className="flex gap-3 max-w-2xl mx-auto w-full">
            <input
              aria-label={locale === 'fr' ? 'Votre message' : 'Your message'}
              className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
              placeholder={t('chat.placeholder')}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
          <button
            type="submit"
            className="cta-glow rounded-xl px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:shadow-blue-500/25"
            disabled={loading}
          >
            {loading ? t('chat.sending') : t('chat.send')}
          </button>
          </form>

          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 max-w-2xl mx-auto w-full" role="alert">
              {error}
            </div>
          )}

          {assistantReply && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-6 whitespace-pre-wrap text-gray-800 dark:text-gray-200 leading-relaxed max-w-2xl mx-auto w-full">
              {assistantReply}
            </div>
          )}

          {leadAsked && !leadSubmitted && (
            <form
              className="mt-6 flex flex-col gap-4 max-w-2xl mx-auto w-full"
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
                    throw new Error(d?.error || (locale === 'fr' ? `Échec de l'enregistrement (${res.status})` : `Failed to save lead (${res.status})`));
                  }
                  setLeadSubmitted(true);
                  setName("");
                  setEmail("");
                  setLeadMessage("");
                } catch (err) {
                  const msg = err instanceof Error ? err.message : (locale === 'fr' ? "Échec de l'enregistrement" : "Failed to save lead");
                  setError(msg);
                } finally {
                  setIsSubmittingLead(false);
                }
              }}
            >
              <div className="text-base text-gray-600 dark:text-gray-400 font-medium text-center">
                {t('lead.prompt')}
              </div>
              <div className="flex flex-col gap-4">
                <input
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder={t('lead.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                  placeholder={t('lead.emailPlaceholder')}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <textarea
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm px-4 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all min-h-[100px] resize-none"
                  placeholder={t('lead.messagePlaceholder')}
                  value={leadMessage}
                  onChange={(e) => setLeadMessage(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="cta-glow rounded-xl px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-lg hover:shadow-blue-500/25"
                >
                  {isSubmittingLead && (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            <div className="text-base text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 max-w-2xl mx-auto w-full text-center font-medium">
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
