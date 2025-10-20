import { NextRequest, NextResponse } from 'next/server';
import { createUnifiedSupabaseClient } from '../../../../lib/supabase-unified';
import { generateApiKey, hashPassword, generateClientId } from '../../../../lib/clients';
import { isTestClient, logTestDetection } from '../../../../lib/test-detection';
import { google } from 'googleapis';
import { generatePersonalizedICP } from '../../../../lib/phase3/icp_profile';

import { handleApiError } from '../../../../lib/error-handler';
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Use the unified Supabase client for consistent database access
    const supabase = createUnifiedSupabaseClient();
    
    
    // Accept both camelCase (from frontend) and snake_case (from tests)
    const name = body.name || body.contactName;
    const email = body.email;
    const business_name = body.business_name || body.businessName;
    const password = body.password;
    const language = body.language;
    const industry_category = body.industryCategory || body.industry_category;
    const primary_service = body.primaryService || body.primary_service;
    const booking_link = body.bookingLink || body.booking_link || null;
    const custom_tagline = body.customTagline || body.custom_tagline || null;
    const email_tone = body.emailTone || body.email_tone || 'Friendly';
    const followup_speed = body.followupSpeed || body.followup_speed || 'Instant';

    // Extract ICP fields (optional)
    const target_client_type = body.targetClientType || body.target_client_type || '';
    const average_deal_size = body.averageDealSize || body.average_deal_size || '';
    const main_business_goal = body.mainBusinessGoal || body.main_business_goal || '';
    const biggest_challenge = body.biggestChallenge || body.biggest_challenge || '';

    console.log('[E2E-Test] [ClientRegistration] New registration request:', { 
      name, 
      email, 
      business_name, 
      language,
      hasIcpData: !!(target_client_type || average_deal_size || main_business_goal || biggest_challenge)
    });

    // Validation
    if (!name || !email || !business_name || !password || !industry_category || !primary_service) {
      console.error('[E2E-Test] [ClientRegistration] ❌ Missing required fields:', { 
        hasName: !!name, 
        hasEmail: !!email, 
        hasBusinessName: !!business_name, 
        hasPassword: !!password,
        hasIndustry: !!industry_category,
        hasService: !!primary_service
      });
      return NextResponse.json(
        { success: false, error: 'All required fields must be filled (name, email, business_name, password, industry, service)' },
        { status: 400 }
      );
    }
    
    // Validate email tone
    const validTones = ['Professional', 'Friendly', 'Formal', 'Energetic'];
    if (!validTones.includes(email_tone)) {
      console.error('[E2E-Test] [ClientRegistration] ❌ Invalid email tone:', email_tone);
      return NextResponse.json(
        { success: false, error: 'Invalid email tone. Must be: Professional, Friendly, Formal, or Energetic' },
        { status: 400 }
      );
    }
    
    // Validate followup speed
    const validSpeeds = ['Instant', 'Within 1 hour', 'Same day'];
    if (!validSpeeds.includes(followup_speed)) {
      console.error('[E2E-Test] [ClientRegistration] ❌ Invalid followup speed:', followup_speed);
      return NextResponse.json(
        { success: false, error: 'Invalid follow-up speed. Must be: Instant, Within 1 hour, or Same day' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /.+@.+\..+/;
    if (!emailRegex.test(email)) {
      console.error('[E2E-Test] [ClientRegistration] ❌ Invalid email format');
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate language (default to 'en' if not provided)
    const clientLanguage = language || 'en';
    if (!['en', 'fr'].includes(clientLanguage)) {
      console.error('[E2E-Test] [ClientRegistration] ❌ Invalid language');
      return NextResponse.json(
        { success: false, error: 'Language must be en or fr' },
        { status: 400 }
      );
    }

    // Check if email already exists (exclude internal clients)
    const { data: existing, error: checkError } = await supabase
      .from('clients')
      .select('email, is_internal')
      .eq('email', email)
      .eq('is_internal', false)  // Only check non-internal clients
      .single();

    console.log('[E2E-Test] [ClientRegistration] Email check result:', { 
      exists: !!existing, 
      error: checkError?.message || 'none' 
    });

    if (existing) {
      console.error('[E2E-Test] [ClientRegistration] ❌ Email already registered:', email);
      return NextResponse.json(
        { success: false, error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Generate credentials
    const apiKey = generateApiKey();
    const clientId = generateClientId();
    const passwordHash = await hashPassword(password);

    console.log('[E2E-Test] [ClientRegistration] Generated credentials:', { 
      clientId, 
      apiKey: apiKey.substring(0, 15) + '...',
      passwordHashLength: passwordHash.length,
    });

    // Detect if this is test data
    const isTest = isTestClient({ business_name, name, email });
    logTestDetection('Client registration', isTest, 
      isTest ? 'Contains test keywords or example domain' : undefined);
    
    // Insert into database using actual column names
    const insertData = {
      name: name,
      email: email,
      business_name: business_name,
      contact_name: name, // Use name for contact_name as well
      password_hash: passwordHash,
      language: clientLanguage,
      api_key: apiKey,
      client_id: clientId,
      is_internal: false, // Mark as external client (user signup)
      is_test: isTest, // Mark as test data if detected
      industry_category: industry_category,
      primary_service: primary_service,
      booking_link: booking_link,
      custom_tagline: custom_tagline,
      email_tone: email_tone,
      followup_speed: followup_speed,
      ai_personalized_reply: true, // Enable AI replies by default
      // ICP data (optional fields)
      icp_data: {
        target_client_type: target_client_type || null,
        average_deal_size: average_deal_size || null,
        main_business_goal: main_business_goal || null,
        biggest_challenge: biggest_challenge || null,
        icp_version: "1.0",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };

    console.log('[E2E-Test] [ClientRegistration] Inserting into Supabase with data:', {
      name: insertData.name,
      email: insertData.email,
      business_name: insertData.business_name,
      language: insertData.language,
      has_password_hash: !!insertData.password_hash,
      has_api_key: !!insertData.api_key,
      has_client_id: !!insertData.client_id,
    });


    let newClient;
    let dbError;


    // Try regular insert first
    const insertResult = await supabase
      .from('clients')
      .insert(insertData)
      .select()
      .single();
    
    newClient = insertResult.data;
    dbError = insertResult.error;



    if (dbError) {
      console.error('[E2E-Test] [ClientRegistration] ❌ Database error:', dbError);
      console.error('[E2E-Test] [ClientRegistration] ❌ Error details:', {
        message: dbError.message,
        code: dbError.code,
        hint: dbError.hint,
        details: dbError.details,
      });
      return NextResponse.json(
        { success: false, error: 'Failed to create account: ' + dbError.message },
        { status: 500 }
      );
    }

    console.log('[E2E-Test] [ClientRegistration] ✅ Client created in Supabase:', newClient.id);
    console.log('[E2E-Test] [ClientRegistration] ✅ Full client data:', {
      id: newClient.id,
      client_id: newClient.client_id,
      name: newClient.name,
      email: newClient.email,
      business_name: newClient.business_name,
      language: newClient.language,
    });
    console.log('[E2E-Test] [ClientRegistration] ✅ API key assigned:', apiKey);

    // Generate personalized ICP if ICP data is provided
    if (target_client_type || average_deal_size || main_business_goal || biggest_challenge) {
      try {
        const icpData = {
          target_client_type,
          average_deal_size,
          main_business_goal,
          biggest_challenge
        };
        
        await generatePersonalizedICP(newClient.id, icpData);
        console.log('[E2E-Test] [ClientRegistration] ✅ Personalized ICP generated for client:', newClient.id);
      } catch (error) {
        console.log('[E2E-Test] [ClientRegistration] ⚠️ ICP generation failed (non-blocking):', error instanceof Error ? error.message : error);
      }
    }

    // TODO: Send welcome email (currently disabled for E2E testing)
    // sendWelcomeEmail(...) would go here
    console.log('[E2E-Test] [ClientRegistration] ℹ️  Welcome email disabled for testing');

    return NextResponse.json({
      success: true,
      data: {
        clientId: newClient.client_id,
        businessName: newClient.business_name,
        name: newClient.name,
        email: newClient.email,
        apiKey: newClient.api_key, // Include for testing/onboarding
      },
    });

  } catch (error) {
    return handleApiError(error, 'API');
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

