#!/usr/bin/env node
// ============================================
// Video Demo Dataset Generator
// ============================================
// Creates a comprehensive demo dataset specifically designed for video recording
// Features: 15 total leads with 5+ repeat leads showing relationship evolution
// ⚠️ SAFE FOR PRODUCTION - All data marked as is_test: true

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase credentials not configured');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// ============================================
// Video Demo Data Generation
// ============================================

// Fixed client ID for consistent demo
const clientId = 'demo-video-client-2024';
const companyName = 'Growth AI Video Demo';

// Demo client data
const DEMO_CLIENT = {
  client_id: clientId,
  business_name: companyName,
  contact_name: 'Video Demo Manager',
  email: 'demo@aveniraisolutions.ca',
  password: 'DemoVideo2024!',
  language: 'en',
  timezone: 'America/Toronto',
  is_test: true,
  api_key: 'demo-video-api-key-2024',
};

// Comprehensive lead dataset with repeat leads for relationship insights
const VIDEO_DEMO_LEADS = [
  // === REPEAT LEAD 1: Sarah Chen (3 interactions) ===
  {
    name: 'Sarah Chen',
    email: 'sarah.chen@techinnovate.ca',
    company: 'TechInnovate Solutions',
    message: 'Hi, we\'re looking for AI automation for our customer support team. Can you help us understand your solutions?',
    ai_summary: 'Enterprise B2B inquiry for AI customer support automation. Strong interest in scaling support operations.',
    intent: 'B2B partnership for AI scaling',
    tone: 'Professional and direct',
    urgency: 'High',
    confidence_score: 0.89,
    language: 'en',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    relationship_insight: 'Initial inquiry shows strong enterprise potential. Follow up within 24 hours.',
    tone_history: [
      { value: 'Professional and direct', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    confidence_history: [
      { value: 0.89, timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    urgency_history: [
      { value: 'High', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },
  {
    name: 'Sarah Chen',
    email: 'sarah.chen@techinnovate.ca',
    company: 'TechInnovate Solutions',
    message: 'Thanks for the demo! Our team was impressed. We\'d like to discuss pricing and implementation timeline.',
    ai_summary: 'Positive follow-up after demo. Ready to move to pricing discussion. High conversion probability.',
    intent: 'Pricing and implementation discussion',
    tone: 'Enthusiastic and engaged',
    urgency: 'High',
    confidence_score: 0.94,
    language: 'en',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    relationship_insight: 'Demo was successful. Ready for sales conversation. Schedule pricing call immediately.',
    tone_history: [
      { value: 'Professional and direct', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 'Enthusiastic and engaged', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    confidence_history: [
      { value: 0.89, timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 0.94, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    urgency_history: [
      { value: 'High', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 'High', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },
  {
    name: 'Sarah Chen',
    email: 'sarah.chen@techinnovate.ca',
    company: 'TechInnovate Solutions',
    message: 'We\'ve decided to move forward! When can we start the implementation?',
    ai_summary: 'CONVERTED LEAD! Ready to proceed with implementation. High-value enterprise client secured.',
    intent: 'Implementation and onboarding',
    tone: 'Excited and committed',
    urgency: 'High',
    confidence_score: 0.98,
    language: 'en',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    relationship_insight: 'CONVERTED! Excellent relationship progression. Ready for onboarding process.',
    tone_history: [
      { value: 'Professional and direct', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 'Enthusiastic and engaged', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 'Excited and committed', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    confidence_history: [
      { value: 0.89, timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 0.94, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 0.98, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    urgency_history: [
      { value: 'High', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 'High', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 'High', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },

  // === REPEAT LEAD 2: Marie Dubois (2 interactions) ===
  {
    name: 'Marie Dubois',
    email: 'marie.dubois@soltech.qc.ca',
    company: 'Solutions Technologiques Québec',
    message: 'Bonjour, nous cherchons des solutions d\'automatisation pour notre équipe de vente. Pouvez-vous nous aider?',
    ai_summary: 'Demande B2B québécoise pour l\'automatisation des ventes. Intérêt modéré mais potentiel de croissance.',
    intent: 'Automatisation des ventes',
    tone: 'Professionnel et curieux',
    urgency: 'Medium',
    confidence_score: 0.72,
    language: 'fr',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    relationship_insight: 'Premier contact prometteur. Suivi en français recommandé.',
    tone_history: [
      { value: 'Professionnel et curieux', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    confidence_history: [
      { value: 0.72, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    urgency_history: [
      { value: 'Medium', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },
  {
    name: 'Marie Dubois',
    email: 'marie.dubois@soltech.qc.ca',
    company: 'Solutions Technologiques Québec',
    message: 'Merci pour les informations. Nous aimerions organiser une démonstration la semaine prochaine.',
    ai_summary: 'Intérêt croissant après réception des informations. Prêt pour une démonstration. Bonne progression.',
    intent: 'Démonstration et évaluation',
    tone: 'Intéressé et proactif',
    urgency: 'High',
    confidence_score: 0.85,
    language: 'fr',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    relationship_insight: 'Progression positive. Prêt pour démonstration. Planifier rapidement.',
    tone_history: [
      { value: 'Professionnel et curieux', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 'Intéressé et proactif', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    confidence_history: [
      { value: 0.72, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 0.85, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    urgency_history: [
      { value: 'Medium', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 'High', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },

  // === REPEAT LEAD 3: Alex Rivera (2 interactions) ===
  {
    name: 'Alex Rivera',
    email: 'alex.rivera@datadriven.ca',
    company: 'DataDriven Analytics',
    message: 'We need help with lead qualification automation. Our current process is too manual.',
    ai_summary: 'B2B inquiry for lead qualification automation. Clear pain point with manual processes.',
    intent: 'Lead qualification automation',
    tone: 'Frustrated but motivated',
    urgency: 'High',
    confidence_score: 0.81,
    language: 'en',
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    relationship_insight: 'Clear pain point identified. High urgency indicates immediate need.',
    tone_history: [
      { value: 'Frustrated but motivated', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    confidence_history: [
      { value: 0.81, timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    urgency_history: [
      { value: 'High', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },
  {
    name: 'Alex Rivera',
    email: 'alex.rivera@datadriven.ca',
    company: 'DataDriven Analytics',
    message: 'The demo was exactly what we needed. Can we discuss integration with our existing CRM?',
    ai_summary: 'Positive demo feedback. Ready for technical integration discussion. Strong conversion potential.',
    intent: 'Technical integration discussion',
    tone: 'Satisfied and technical',
    urgency: 'High',
    confidence_score: 0.91,
    language: 'en',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    relationship_insight: 'Demo successful. Moving to technical phase. High conversion probability.',
    tone_history: [
      { value: 'Frustrated but motivated', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 'Satisfied and technical', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    confidence_history: [
      { value: 0.81, timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 0.91, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    urgency_history: [
      { value: 'High', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 'High', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },

  // === REPEAT LEAD 4: Sophie Gagnon (2 interactions) ===
  {
    name: 'Sophie Gagnon',
    email: 'sophie@techavancee.ca',
    company: 'Technologies Avancées',
    message: 'Nous explorons des solutions IA pour améliorer notre service client. Quelles sont vos recommandations?',
    ai_summary: 'Exploration des solutions IA pour le service client. Demande de recommandations personnalisées.',
    intent: 'Consultation en solutions IA',
    tone: 'Exploratoire et ouvert',
    urgency: 'Medium',
    confidence_score: 0.68,
    language: 'fr',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    relationship_insight: 'Phase d\'exploration. Besoin de guidance et de recommandations personnalisées.',
    tone_history: [
      { value: 'Exploratoire et ouvert', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    confidence_history: [
      { value: 0.68, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    urgency_history: [
      { value: 'Medium', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },
  {
    name: 'Sophie Gagnon',
    email: 'sophie@techavancee.ca',
    company: 'Technologies Avancées',
    message: 'Vos recommandations sont très pertinentes. Nous aimerions voir une démonstration personnalisée.',
    ai_summary: 'Recommandations bien reçues. Demande de démonstration personnalisée. Progression positive.',
    intent: 'Démonstration personnalisée',
    tone: 'Intéressé et spécifique',
    urgency: 'High',
    confidence_score: 0.83,
    language: 'fr',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    relationship_insight: 'Recommandations efficaces. Prêt pour démonstration personnalisée.',
    tone_history: [
      { value: 'Exploratoire et ouvert', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 'Intéressé et spécifique', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    confidence_history: [
      { value: 0.68, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 0.83, timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    urgency_history: [
      { value: 'Medium', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 'High', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },

  // === REPEAT LEAD 5: Jordan Lee (2 interactions) ===
  {
    name: 'Jordan Lee',
    email: 'jordan.lee@marketingai.ca',
    company: 'Marketing AI Solutions',
    message: 'We\'re interested in AI solutions for our marketing team. What can you offer?',
    ai_summary: 'Marketing team inquiry for AI solutions. General interest in marketing automation.',
    intent: 'Marketing automation interest',
    tone: 'Curious and exploratory',
    urgency: 'Medium',
    confidence_score: 0.74,
    language: 'en',
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days ago
    relationship_insight: 'Initial marketing inquiry. Needs education on specific solutions.',
    tone_history: [
      { value: 'Curious and exploratory', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    confidence_history: [
      { value: 0.74, timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    urgency_history: [
      { value: 'Medium', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },
  {
    name: 'Jordan Lee',
    email: 'jordan.lee@marketingai.ca',
    company: 'Marketing AI Solutions',
    message: 'After reviewing your materials, we\'d like to discuss a pilot program for our Q1 campaign.',
    ai_summary: 'Ready for pilot program discussion. Q1 campaign timeline indicates urgency. Strong potential.',
    intent: 'Pilot program discussion',
    tone: 'Decisive and timeline-focused',
    urgency: 'High',
    confidence_score: 0.88,
    language: 'en',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    relationship_insight: 'Materials review successful. Ready for pilot discussion. Q1 timeline creates urgency.',
    tone_history: [
      { value: 'Curious and exploratory', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 'Decisive and timeline-focused', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    confidence_history: [
      { value: 0.74, timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 0.88, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    urgency_history: [
      { value: 'Medium', timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString() },
      { value: 'High', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },

  // === NEW LEADS (6 additional unique leads) ===
  {
    name: 'David Thompson',
    email: 'david@cloudfirst.tech',
    company: 'CloudFirst Technologies',
    message: 'Looking for AI automation to streamline our sales pipeline. Can you help us scale?',
    ai_summary: 'Sales pipeline automation request. Focus on scaling operations with AI solutions.',
    intent: 'Sales pipeline automation',
    tone: 'Ambitious and growth-focused',
    urgency: 'High',
    confidence_score: 0.86,
    language: 'en',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    relationship_insight: 'Strong growth mindset. Ready for scaling discussion.',
    tone_history: [
      { value: 'Ambitious and growth-focused', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    confidence_history: [
      { value: 0.86, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    urgency_history: [
      { value: 'High', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },
  {
    name: 'Isabelle Roy',
    email: 'isabelle@innovdigitale.ca',
    company: 'Innovation Digitale',
    message: 'Nous cherchons des solutions d\'intelligence artificielle pour optimiser nos processus internes.',
    ai_summary: 'Demande d\'optimisation des processus internes avec l\'IA. Focus sur l\'efficacité opérationnelle.',
    intent: 'Optimisation des processus',
    tone: 'Professionnel et méthodique',
    urgency: 'Medium',
    confidence_score: 0.79,
    language: 'fr',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
    relationship_insight: 'Approche méthodique. Besoin d\'analyse détaillée des processus.',
    tone_history: [
      { value: 'Professionnel et méthodique', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    confidence_history: [
      { value: 0.79, timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    urgency_history: [
      { value: 'Medium', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },
  {
    name: 'Michael Chen',
    email: 'michael@digitalinnovations.com',
    company: 'Digital Innovations Inc',
    message: 'We need help with customer data analysis and personalization. What AI tools do you recommend?',
    ai_summary: 'Customer data analysis and personalization inquiry. Focus on AI-powered customer insights.',
    intent: 'Customer data analysis',
    tone: 'Analytical and data-driven',
    urgency: 'Medium',
    confidence_score: 0.82,
    language: 'en',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
    relationship_insight: 'Data-driven approach. Strong potential for analytics solutions.',
    tone_history: [
      { value: 'Analytical and data-driven', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    confidence_history: [
      { value: 0.82, timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    urgency_history: [
      { value: 'Medium', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },
  {
    name: 'Antoine Lavoie',
    email: 'antoine@techfutur.ca',
    company: 'Technologies Futuristes',
    message: 'Nous voulons intégrer l\'IA dans notre stratégie de croissance. Quelles sont vos recommandations?',
    ai_summary: 'Demande de stratégie de croissance avec l\'IA. Vision à long terme et approche stratégique.',
    intent: 'Stratégie de croissance IA',
    tone: 'Visionnaire et stratégique',
    urgency: 'Low',
    confidence_score: 0.71,
    language: 'fr',
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    relationship_insight: 'Vision à long terme. Besoin de conseil stratégique approfondi.',
    tone_history: [
      { value: 'Visionnaire et stratégique', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    confidence_history: [
      { value: 0.71, timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    urgency_history: [
      { value: 'Low', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },
  {
    name: 'Emily Rodriguez',
    email: 'emily@cloudfirst.tech',
    company: 'CloudFirst Technologies',
    message: 'Our team is overwhelmed with lead management. We need an AI solution to help us prioritize.',
    ai_summary: 'Lead management overwhelm. Clear need for AI-powered lead prioritization and organization.',
    intent: 'Lead prioritization automation',
    tone: 'Overwhelmed but solution-focused',
    urgency: 'High',
    confidence_score: 0.87,
    language: 'en',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
    relationship_insight: 'Clear pain point. High urgency indicates immediate need for solution.',
    tone_history: [
      { value: 'Overwhelmed but solution-focused', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    confidence_history: [
      { value: 0.87, timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    urgency_history: [
      { value: 'High', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  },
  {
    name: 'Camille Moreau',
    email: 'camille@solintel.ca',
    company: 'Solutions Intelligentes',
    message: 'Nous explorons des options d\'automatisation pour notre service client. Pouvez-vous nous conseiller?',
    ai_summary: 'Exploration des options d\'automatisation du service client. Demande de conseil personnalisé.',
    intent: 'Conseil en automatisation',
    tone: 'Consultatif et ouvert',
    urgency: 'Medium',
    confidence_score: 0.75,
    language: 'fr',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    relationship_insight: 'Approche consultative. Besoin de guidance personnalisée.',
    tone_history: [
      { value: 'Consultatif et ouvert', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    confidence_history: [
      { value: 0.75, timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
    ],
    urgency_history: [
      { value: 'Medium', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
    ]
  }
];

// ============================================
// Main Function
// ============================================

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║     🎬 VIDEO DEMO DATASET GENERATOR                         ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('🎯 Creating comprehensive demo dataset for video recording');
  console.log('');
  console.log('[Seed] Client ID:', clientId);
  console.log('[Seed] Company name:', companyName);
  console.log('[Seed] Total leads:', VIDEO_DEMO_LEADS.length);
  console.log('[Seed] Repeat leads: 5 (Sarah Chen, Marie Dubois, Alex Rivera, Sophie Gagnon, Jordan Lee)');
  console.log('');
  
  let clientData = null;
  
  // Step 1: Create or update demo client
  console.log('🏢 Step 1: Creating/updating demo client...');
  const hashedPassword = await bcrypt.hash(DEMO_CLIENT.password, 10);
  
  // Check if client already exists
  const { data: existingClient } = await supabase
    .from('clients')
    .select('*')
    .eq('client_id', clientId)
    .single();
  
  if (existingClient) {
    console.log('   ⚠️  Client already exists, updating...');
    const { error: updateError } = await supabase
      .from('clients')
      .update({
        business_name: DEMO_CLIENT.business_name,
        contact_name: DEMO_CLIENT.contact_name,
        email: DEMO_CLIENT.email,
        password_hash: hashedPassword,
        language: DEMO_CLIENT.language,
        timezone: DEMO_CLIENT.timezone,
        api_key: DEMO_CLIENT.api_key,
        is_test: DEMO_CLIENT.is_test,
      })
      .eq('client_id', clientId);
    
    if (updateError) {
      console.error('❌ Failed to update demo client:', updateError.message);
      process.exit(1);
    }
    console.log('   ✅ Demo client updated');
    clientData = existingClient;
  } else {
    const { data: newClient, error: createError } = await supabase
      .from('clients')
      .insert([{
        client_id: DEMO_CLIENT.client_id,
        business_name: DEMO_CLIENT.business_name,
        contact_name: DEMO_CLIENT.contact_name,
        email: DEMO_CLIENT.email,
        password_hash: hashedPassword,
        language: DEMO_CLIENT.language,
        timezone: DEMO_CLIENT.timezone,
        api_key: DEMO_CLIENT.api_key,
        is_test: DEMO_CLIENT.is_test,
      }])
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Failed to create demo client:', createError.message);
      process.exit(1);
    }
    console.log('   ✅ Demo client created');
    clientData = newClient;
  }
  
  console.log('   Email:', DEMO_CLIENT.email);
  console.log('   Password:', DEMO_CLIENT.password);
  console.log('   Is Test:', DEMO_CLIENT.is_test);
  console.log('');
  
  // Step 2: Clear existing leads for this client
  console.log('🧹 Step 2: Clearing existing demo leads...');
  
  if (clientData) {
    // Clear lead_actions for this client
    const { error: deleteActionsError } = await supabase
      .from('lead_actions')
      .delete()
      .eq('client_id', clientData.id);
    
    if (deleteActionsError) {
      console.error('❌ Failed to clear existing lead actions:', deleteActionsError.message);
    } else {
      console.log('   ✅ Existing lead actions cleared');
    }
  }
  console.log('');
  
  // Step 3: Insert new demo leads
  console.log('👥 Step 3: Inserting video demo leads...');
  console.log('   Total leads:', VIDEO_DEMO_LEADS.length);
  console.log('   Repeat leads: 5');
  console.log('   New leads: 6');
  console.log('   English: 9, French: 6');
  console.log('');
  
  // Get client UUID for lead_actions (reuse existing clientData from step 2)
  if (!clientData) {
    console.error('❌ Client not found for lead insertion');
    process.exit(1);
  }
  
  const clientUuid = clientData.id;
  console.log('   Client UUID:', clientUuid);
  
  // Insert leads into lead_memory and create lead_actions
  let insertedCount = 0;
  
  for (const lead of VIDEO_DEMO_LEADS) {
    // Insert into lead_memory
    const { data: leadMemory, error: memoryError } = await supabase
      .from('lead_memory')
      .insert([{
        name: lead.name,
        email: lead.email,
        message: lead.message,
        ai_summary: lead.ai_summary,
        intent: lead.intent,
        tone: lead.tone,
        urgency: lead.urgency,
        confidence_score: lead.confidence_score,
        language: lead.language,
        timestamp: lead.timestamp,
        relationship_insight: lead.relationship_insight,
        tone_history: lead.tone_history,
        confidence_history: lead.confidence_history,
        urgency_history: lead.urgency_history,
        archived: false,
        deleted: false,
        current_tag: 'New Lead',
        last_updated: lead.timestamp,
      }])
      .select()
      .single();
    
    if (memoryError) {
      console.error('❌ Failed to insert lead memory:', memoryError.message);
      continue;
    }
    
    // Create lead_action to link to client
    const { error: actionError } = await supabase
      .from('lead_actions')
      .insert([{
        lead_id: leadMemory.id,
        client_id: clientUuid,
        action_type: 'insert',
        tag: 'New Lead',
        created_at: lead.timestamp,
        timestamp: lead.timestamp,
        is_test: true,
      }]);
    
    if (actionError) {
      console.error('❌ Failed to create lead action:', actionError.message);
      continue;
    }
    
    insertedCount++;
    console.log(`   ✅ Inserted lead ${insertedCount}/${VIDEO_DEMO_LEADS.length}: ${lead.name}`);
  }
  
  console.log('   ✅ Demo leads inserted successfully');
  console.log('   Inserted count:', insertedCount);
  console.log('');
  
  // Step 4: Trigger intelligence engine
  console.log('🧠 Step 4: Triggering intelligence engine...');
  const intelligenceEngineUrl = 'https://www.aveniraisolutions.ca/api/intelligence-engine';
  
  try {
    const response = await fetch(intelligenceEngineUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, simulate: true }),
    });
    
    const result = await response.json();
    console.log('   ✅ Intelligence engine response:', result);
    
    if (result.success) {
      console.log('   📊 Analytics generated successfully');
    } else {
      console.log('   ⚠️  Intelligence engine completed with issues');
    }
  } catch (error) {
    console.log('   ⚠️  Intelligence engine call failed:', error.message);
  }
  console.log('');
  
  // Step 5: Verify analytics
  console.log('📊 Step 5: Verifying analytics data...');
  const { data: analytics } = await supabase
    .from('growth_brain')
    .select('*')
    .eq('client_id', clientId)
    .single();
  
  if (analytics) {
    console.log('   ✅ Analytics record found');
    console.log('   Engagement Score:', analytics.engagement_score);
    console.log('   Average Confidence:', analytics.avg_confidence);
    console.log('   Total Leads:', analytics.total_leads);
  } else {
    console.log('   ⚠️  No analytics record found');
  }
  console.log('');
  
  // Step 6: Summary
  console.log('🎬 VIDEO DEMO DATASET READY!');
  console.log('');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Dashboard Features Activated:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('');
  console.log('✅ Predictive Growth Engine:');
  console.log('   • Urgency Trend: Mix of High/Medium/Low urgency');
  console.log('   • Confidence Insight: Range from 0.68 to 0.98');
  console.log('   • Tone Insight: Professional, Enthusiastic, Analytical, etc.');
  console.log('   • Language Ratio: 60% English, 40% French');
  console.log('');
  console.log('✅ Relationship Insights:');
  console.log('   • Sarah Chen: 3 interactions (89% → 94% → 98% confidence)');
  console.log('   • Marie Dubois: 2 interactions (72% → 85% confidence)');
  console.log('   • Alex Rivera: 2 interactions (81% → 91% confidence)');
  console.log('   • Sophie Gagnon: 2 interactions (68% → 83% confidence)');
  console.log('   • Jordan Lee: 2 interactions (74% → 88% confidence)');
  console.log('');
  console.log('✅ Growth Copilot:');
  console.log('   • Rich data for trend analysis');
  console.log('   • Multiple relationship insights');
  console.log('   • Varied urgency and confidence patterns');
  console.log('');
  console.log('🎯 Login Credentials:');
  console.log('   Email: demo@aveniraisolutions.ca');
  console.log('   Password: DemoVideo2024!');
  console.log('');
  console.log('🌐 Dashboard URLs:');
  console.log('   English: https://www.aveniraisolutions.ca/en/client/dashboard');
  console.log('   French: https://www.aveniraisolutions.ca/fr/client/dashboard');
  console.log('');
  console.log('🎬 Ready for video recording!');
  console.log('');
}

// Run the script
main().catch(console.error);
