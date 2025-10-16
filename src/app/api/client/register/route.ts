import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';
import { generateApiKey, hashPassword, generateClientId } from '../../../../lib/clients';
import { google } from 'googleapis';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      businessName, 
      contactName, 
      email, 
      password, 
      language, 
      leadSourceDescription, 
      estimatedLeadsPerWeek 
    } = body;

    console.log('[ClientRegistration] New registration request:', { businessName, email, language });

    // Validation
    if (!businessName || !contactName || !email || !password || !language) {
      console.error('[ClientRegistration] ❌ Missing required fields');
      return NextResponse.json(
        { success: false, error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /.+@.+\..+/;
    if (!emailRegex.test(email)) {
      console.error('[ClientRegistration] ❌ Invalid email format');
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate language
    if (!['en', 'fr'].includes(language)) {
      console.error('[ClientRegistration] ❌ Invalid language');
      return NextResponse.json(
        { success: false, error: 'Language must be en or fr' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('clients')
      .select('email')
      .eq('email', email)
      .single();

    if (existing) {
      console.error('[ClientRegistration] ❌ Email already registered');
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Generate credentials
    const apiKey = generateApiKey();
    const clientId = generateClientId();
    const passwordHash = await hashPassword(password);

    console.log('[ClientRegistration] Generated credentials:', { 
      clientId, 
      apiKey: apiKey.substring(0, 15) + '...',
    });

    // Insert into database
    const { data: newClient, error: dbError } = await supabase
      .from('clients')
      .insert({
        business_name: businessName,
        contact_name: contactName,
        email: email,
        password_hash: passwordHash,
        language: language,
        api_key: apiKey,
        client_id: clientId,
        lead_source_description: leadSourceDescription || null,
        estimated_leads_per_week: estimatedLeadsPerWeek || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('[ClientRegistration] ❌ Database error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to create account' },
        { status: 500 }
      );
    }

    console.log('[ClientRegistration] ✅ Client created:', newClient.id);

    // Send welcome email
    try {
      await sendWelcomeEmail({
        contactName,
        email,
        apiKey,
        language,
        businessName,
      });
      console.log('[ClientRegistration] ✅ Welcome email sent to:', email);
    } catch (emailError) {
      console.error('[ClientRegistration] ⚠️  Welcome email failed:', emailError);
      // Don't fail registration if email fails
    }

    return NextResponse.json({
      success: true,
      data: {
        clientId: newClient.client_id,
        businessName: newClient.business_name,
        email: newClient.email,
      },
    });

  } catch (error) {
    console.error('[ClientRegistration] ❌ Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function sendWelcomeEmail(params: {
  contactName: string;
  email: string;
  apiKey: string;
  language: string;
  businessName: string;
}) {
  const { contactName, email, apiKey, language, businessName } = params;

  const isEnglish = language === 'en';
  
  const subject = isEnglish
    ? 'Welcome to Avenir AI Solutions — Your AI Dashboard Access'
    : 'Bienvenue sur Avenir AI Solutions — Accès à votre tableau IA';

  const dashboardUrl = isEnglish
    ? 'https://aveniraisolutions.ca/en/client/dashboard'
    : 'https://aveniraisolutions.ca/fr/client/dashboard';

  const apiEndpoint = 'https://aveniraisolutions.ca/api/lead';

  const htmlBody = isEnglish ? `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; letter-spacing: 2px; margin-bottom: 10px;">
          AVENIR AI SOLUTIONS
        </h1>
        <p style="color: #94a3b8; font-size: 14px;">AI Growth Infrastructure</p>
      </div>
      
      <h2 style="color: #60a5fa; font-size: 20px; margin-bottom: 15px;">Hi ${contactName},</h2>
      
      <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 20px;">
        Your account is active! Here's your connection info:
      </p>
      
      <div style="background: rgba(96, 165, 250, 0.1); border: 1px solid rgba(96, 165, 250, 0.3); border-radius: 10px; padding: 20px; margin-bottom: 20px;">
        <p style="margin: 10px 0;"><strong style="color: #60a5fa;">Dashboard:</strong><br/>
        <a href="${dashboardUrl}" style="color: #60a5fa; text-decoration: none;">${dashboardUrl}</a></p>
        
        <p style="margin: 10px 0;"><strong style="color: #60a5fa;">API Endpoint:</strong><br/>
        <code style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; color: #94a3b8;">${apiEndpoint}</code></p>
        
        <p style="margin: 10px 0;"><strong style="color: #60a5fa;">API Key:</strong><br/>
        <code style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; color: #a78bfa; font-size: 12px;">${apiKey}</code></p>
      </div>
      
      <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 20px;">
        Use this key to send leads securely to Avenir. The system will analyze tone, urgency, and intent in real time.
      </p>
      
      <p style="color: #64748b; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
        — Avenir AI Solutions Team
      </p>
    </div>
  ` : `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; color: #ffffff;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="background: linear-gradient(135deg, #60a5fa, #a78bfa); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 28px; letter-spacing: 2px; margin-bottom: 10px;">
          AVENIR AI SOLUTIONS
        </h1>
        <p style="color: #94a3b8; font-size: 14px;">Infrastructure de Croissance IA</p>
      </div>
      
      <h2 style="color: #60a5fa; font-size: 20px; margin-bottom: 15px;">Bonjour ${contactName},</h2>
      
      <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 20px;">
        Votre compte est maintenant actif ! Voici vos informations de connexion :
      </p>
      
      <div style="background: rgba(96, 165, 250, 0.1); border: 1px solid rgba(96, 165, 250, 0.3); border-radius: 10px; padding: 20px; margin-bottom: 20px;">
        <p style="margin: 10px 0;"><strong style="color: #60a5fa;">Tableau de bord :</strong><br/>
        <a href="${dashboardUrl}" style="color: #60a5fa; text-decoration: none;">${dashboardUrl}</a></p>
        
        <p style="margin: 10px 0;"><strong style="color: #60a5fa;">Point de terminaison API :</strong><br/>
        <code style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; color: #94a3b8;">${apiEndpoint}</code></p>
        
        <p style="margin: 10px 0;"><strong style="color: #60a5fa;">Clé API :</strong><br/>
        <code style="background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px; color: #a78bfa; font-size: 12px;">${apiKey}</code></p>
      </div>
      
      <p style="color: #cbd5e1; line-height: 1.6; margin-bottom: 20px;">
        Utilisez cette clé pour envoyer vos leads de façon sécurisée vers Avenir. Le système analysera le ton, l'urgence et l'intention en temps réel.
      </p>
      
      <p style="color: #64748b; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
        — L'équipe Avenir AI Solutions
      </p>
    </div>
  `;

  // Send email via Gmail API
  const credsEnv = process.env.GOOGLE_CREDENTIALS_JSON;
  if (!credsEnv) {
    throw new Error('Missing GOOGLE_CREDENTIALS_JSON');
  }

  const credentials = JSON.parse(credsEnv);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/gmail.send'],
  });

  const gmail = google.gmail({ version: 'v1', auth });

  const emailContent = [
    `From: Avenir AI Solutions <noreply@aveniraisolutions.ca>`,
    `To: ${email}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    htmlBody,
  ].join('\n');

  const encodedEmail = Buffer.from(emailContent).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedEmail,
    },
  });

  console.log(`[ClientRegistration] Welcome email sent to ${email} in ${language}`);
}

