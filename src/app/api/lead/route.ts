/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const, @typescript-eslint/prefer-as-const */
import { NextRequest } from "next/server";
import { google } from "googleapis";
import OpenAI from "openai";
import { getAuthorizedGmail, buildHtmlEmail } from "../../../lib/gmail";
import { supabase, validateApiKey, upsertLeadWithHistory } from "../../../lib/supabase";
import { enrichLeadWithAI } from "../../../lib/ai-enrichment";
import { isTestLead, logTestDetection } from "../../../lib/test-detection";
import { buildPersonalizedHtmlEmail } from "../../../lib/personalized-email";
import { trackAiOutcome } from "../../../lib/outcome-tracker";
import { sendUrgentLeadAlert } from "../../../lib/email-alerts";
import { handleApiError } from '../../../lib/error-handler';
import { validateRequestSize, createSecurityResponse } from '../../../lib/security';

type LeadPayload = {
	name?: string;
	email?: string;
	message?: string;
	timestamp?: string; // ISO string from client; if missing, server will set
	locale?: string; // 'en' or 'fr'
};

// Google Sheets config
const spreadsheetId = "1Zlkx2lDsLIz594ALHOCQNs7byMAaAXcj_wyZSp67GEA"; // provided by user
const sheetRange = "Sheet1!A:D"; // [Name, Email, Message, Timestamp]

// CORS helper function - allows localhost for testing and demos
function getCorsHeaders(origin?: string | null): HeadersInit {
	// Security: Only allow localhost in development
	const allowedOrigins = process.env.NODE_ENV === 'production'
		? [
			'https://www.aveniraisolutions.ca',
			'https://aveniraisolutions.ca',
		]
		: [
			'https://www.aveniraisolutions.ca',
			'https://aveniraisolutions.ca',
			'http://localhost:3000',
			'http://localhost:8000',
			'http://localhost:8001',
			'http://127.0.0.1:8000',
			'http://127.0.0.1:3000',
		];
	
	const originToUse = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
	
	return {
		'Access-Control-Allow-Origin': originToUse,
		'Access-Control-Allow-Methods': 'POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
		'Access-Control-Max-Age': '86400', // 24 hours
		'Content-Type': 'application/json',
	};
}

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Log AI analysis feedback silently in the background
 * This function ensures complete isolation - no modification to existing behavior
 */
async function logAiAnalysisFeedback(
	enrichment: { intent: string; tone: string; urgency: string; confidence_score: number },
	leadId: string | null,
	clientId: string | null,
	message: string,
	aiSummary: string,
	responseTimeMs: number
) {
	try {
		// Log AI outcome tracking silently
		await trackAiOutcome(
			'ai_enrichment_analysis',
			{
				confidence: enrichment.confidence_score,
				predicted_value: {
					intent: enrichment.intent,
					tone: enrichment.tone,
					urgency: enrichment.urgency
				},
				factors: ['message_content', 'ai_summary', 'language_detection']
			},
			{
				actual_value: {
					intent: enrichment.intent,
					tone: enrichment.tone,
					urgency: enrichment.urgency
				},
				success: true,
				response_time_ms: responseTimeMs
			},
			{
				leadId: leadId || undefined,
				clientId: clientId || undefined,
				notes: `AI analysis completed for lead enrichment`,
				notesEn: `AI analysis completed for lead enrichment`,
				notesFr: `Analyse IA terminée pour l'enrichissement du lead`
			}
		);
		
		console.log('[Feedback Integration] ✅ AI analysis feedback logged silently');
	} catch (error) {
		// Silent failure - don't affect existing functionality
		console.log('[Feedback Integration] ⚠️ Failed to log AI analysis feedback (silent):', error instanceof Error ? error.message : error);
	}
}

async function retry<T>(fn: () => Promise<T>, opts?: { maxAttempts?: number; baseMs?: number; jitter?: boolean }) {
	const max = Math.max(1, opts?.maxAttempts ?? 3);
	const base = Math.max(50, opts?.baseMs ?? 200);
	const jitter = opts?.jitter ?? true;
	let attempt = 0;
	let lastErr: unknown;
	while (attempt < max) {
		try {
			return await fn();
		} catch (err) {
			lastErr = err;
			attempt++;
			if (attempt >= max) break;
			const backoff = base * Math.pow(2, attempt - 1);
			const wait = jitter ? Math.floor(backoff * (0.8 + Math.random() * 0.4)) : backoff;
			await sleep(wait);
		}
	}
	throw lastErr instanceof Error ? lastErr : new Error("Operation failed after retries");
}

// Handle CORS preflight requests
export async function OPTIONS(req: NextRequest) {
	const origin = req.headers.get('origin');
	console.log('[Lead API] OPTIONS preflight request from origin:', origin);
	return new Response(null, {
		status: 204,
		headers: getCorsHeaders(origin)
	});
}

export async function POST(req: NextRequest) {
	// Get origin for CORS headers
	const requestOrigin = req.headers.get('origin');
	
	// Security: Validate request size
	if (!validateRequestSize(req)) {
		console.log('[Lead API] ❌ Request too large - rejected');
		return createSecurityResponse('Request too large', 413);
	}
	
	try {
		console.log('[Lead API] ============================================');
		console.log('[Lead API] POST /api/lead triggered');
		console.log('[Lead API] ============================================');
		
		// Get request origin/referer for domain detection
		const origin = requestOrigin || '';
		const referer = req.headers.get('referer') || '';
		const host = req.headers.get('host') || '';
		
		console.log('[Lead API] Request headers:', {
			'content-type': req.headers.get('content-type'),
			'x-api-key': req.headers.get('x-api-key') ? 'present' : 'none',
			'origin': origin,
			'referer': referer,
			'host': host,
			'user-agent': req.headers.get('user-agent')?.substring(0, 50) || 'unknown',
		});
		
		// Check for API key authentication
		const apiKey = req.headers.get('x-api-key');
		let clientId: string | null = null;
		
		if (apiKey) {
			console.log('[E2E-Test] [LeadAPI] API key provided - validating...');
			console.log('[E2E-Test] [LeadAPI] API key format:', apiKey.substring(0, 20) + '...');
			
			// Validate API key for external clients
			const client = await validateApiKey(apiKey);
			
			if (!client) {
				console.log('[E2E-Test] [LeadAPI] ❌ Invalid API key — rejected');
				return new Response(
					JSON.stringify({ success: false, error: "Unauthorized: Invalid API key" }),
					{ status: 401, headers: getCorsHeaders(requestOrigin) }
				);
			}
			
			clientId = client.client_id;
			console.log(`[E2E-Test] [LeadAPI] ✅ Valid API key`);
			console.log(`[E2E-Test] [LeadAPI] Lead received from client_id: ${clientId}`);
			console.log(`[E2E-Test] [LeadAPI] Business: ${client.business_name || 'N/A'}`);
			console.log(`[E2E-Test] [LeadAPI] Client info:`, {
				id: client.id,
				client_id: client.client_id,
				name: client.name,
				email: client.email,
				business_name: client.business_name,
			});
			
			// Update last_connection timestamp
			console.log('[E2E-Test] [LeadAPI] Updating last_connection timestamp...');
			const { error: updateError } = await supabase
				.from('clients')
				.update({ last_connection: new Date().toISOString() })
				.eq('api_key', apiKey);
			
			if (updateError) {
				console.warn('[E2E-Test] [LeadAPI] ⚠️  Failed to update last_connection:', updateError);
			} else {
				console.log('[E2E-Test] [LeadAPI] ✅ last_connection updated');
			}
		} else {
			// No API key = check if request is from Avenir domain
			// Check origin, referer, or host for aveniraisolutions.ca
			const isAvenirDomain = 
				origin.includes('aveniraisolutions.ca') ||
				referer.includes('aveniraisolutions.ca') ||
				host.includes('aveniraisolutions.ca');
			
			if (isAvenirDomain) {
				// Auto-link to Avenir AI Solutions internal client
				console.log('[Lead API] 🔍 Domain detection: aveniraisolutions.ca');
				console.log('[Lead API] 🏢 Auto-linked lead to internal client \'Avenir AI Solutions\' (client_id: 00000000-0000-0000-0000-000000000001)');
				console.log('[Lead API] ✅ Origin verification: EN/FR forms both supported');
				clientId = '00000000-0000-0000-0000-000000000001';
			} else {
				// External request from unknown domain
				console.log('[Lead API] ⚠️  Request from non-Avenir domain');
				console.log('[Lead API] Origin:', origin || 'none');
				console.log('[Lead API] Referer:', referer || 'none');
				console.log('[Lead API] No client_id assigned (external/unknown source)');
				clientId = null;
			}
		}
		
		console.log('[Lead API] Parsing request body...');
		const body = (await req.json().catch((err) => {
			console.error('[Lead API] ❌ Failed to parse JSON body:', err);
			return null;
		})) as LeadPayload | null;
		
		if (!body || typeof body !== "object") {
			console.error('[Lead API] ❌ Invalid or missing JSON body');
			return new Response(
				JSON.stringify({ success: false, error: "Invalid JSON body" }),
				{ status: 400, headers: getCorsHeaders(requestOrigin) }
			);
		}

		const name = (body.name || "").toString().trim();
		const email = (body.email || "").toString().trim();
		const message = (body.message || "").toString().trim();
		const providedTimestamp = (body.timestamp || "").toString().trim();
		const locale = (body.locale || "en").toString().trim();

		console.log('[Lead API] Request body parsed:', {
			name,
			email,
			message_length: message.length,
			locale,
			has_timestamp: !!providedTimestamp,
		});

		if (!name || !email || !message) {
			console.error('[Lead API] ❌ Missing required fields');
			return new Response(
				JSON.stringify({ success: false, error: "'name', 'email', and 'message' are required" }),
				{ status: 400, headers: getCorsHeaders(requestOrigin) }
			);
		}

		// very light email validation
		const emailOk = /.+@.+\..+/.test(email);
		if (!emailOk) {
			console.error('[Lead API] ❌ Invalid email format:', email);
			return new Response(
				JSON.stringify({ success: false, error: "Please provide a valid email" }),
				{ status: 400, headers: getCorsHeaders(requestOrigin) }
			);
		}
		
		console.log('[Lead API] ✅ Validation passed - proceeding with lead processing');

		// Development mode: Skip Gmail/Sheets and go directly to AI enrichment
		// Detect development mode by: NODE_ENV=development OR missing Google credentials
		const isDevelopment = 
			process.env.NODE_ENV === 'development' || 
			!process.env.NODE_ENV ||
			!process.env.GOOGLE_CREDENTIALS_JSON;
		
		if (isDevelopment) {
			console.log('[Lead API] ============================================');
			console.log('[Lead API] 🧪 DEVELOPMENT MODE DETECTED');
			console.log('[Lead API] ============================================');
			console.log('[Lead API] Detection reasons:');
			console.log('[Lead API]   NODE_ENV:', process.env.NODE_ENV || 'not set');
			console.log('[Lead API]   Has GOOGLE_CREDENTIALS_JSON:', !!process.env.GOOGLE_CREDENTIALS_JSON);
			console.log('[Lead API] 🧪 Skipping Gmail send (development mode)');
			console.log('[Lead API] 🧪 Skipping Google Sheets append (development mode)');
			console.log('[Lead API] Email would have been sent to:', email);
			console.log('[Lead API] Proceeding directly to AI enrichment and storage...');
			console.log('[Lead API] ============================================');
			
			const timestamp = providedTimestamp || new Date().toISOString();
			
			// Mock AI summary for development
			const aiSummary = `[DEV MODE] Lead inquiry from ${name}`;
			
			// Detect if this is test data
			const isTest = isTestLead({ name, email, message });
			logTestDetection('Lead submission', isTest,
				isTest ? 'Contains test keywords or example domain' : undefined);
			
			// AI Intelligence Layer: Analyze and store/update lead
			try {
				console.log('[AI Intelligence] ============================================');
				console.log('[AI Intelligence] Starting AI Intelligence & Storage');
				console.log('[AI Intelligence] ============================================');
				console.log('[AI Intelligence] Analyzing lead for enrichment...');
				
				// Track AI analysis timing for feedback logging
				const aiAnalysisStartTime = Date.now();
				const enrichment = await enrichLeadWithAI({
					message,
					aiSummary,
					language: locale,
				});
				const aiAnalysisResponseTime = Date.now() - aiAnalysisStartTime;
				
				console.log('[AI Intelligence] ✅ Enrichment complete:', {
					intent: enrichment.intent,
					tone: enrichment.tone,
					urgency: enrichment.urgency,
					confidence: enrichment.confidence_score,
				});
				
				// Upsert lead with historical tracking
				console.log('[AI Intelligence] Calling upsertLeadWithHistory()...');
				
				const upsertParams = {
					email,
					name,
					message,
					ai_summary: aiSummary || null,
					language: locale,
					timestamp,
					intent: enrichment.intent,
					tone: enrichment.tone,
					urgency: enrichment.urgency,
					confidence_score: enrichment.confidence_score,
					client_id: clientId,
					is_test: isTest,
				};
				
				const result = await upsertLeadWithHistory(upsertParams);
				
				console.log('[AI Intelligence] upsertLeadWithHistory() completed');
				console.log('[AI Intelligence] Result:', {
					isNew: result.isNew,
					leadId: result.leadId,
					hasInsight: !!result.insight,
				});
				
				// Log AI analysis feedback silently in the background (complete isolation)
				logAiAnalysisFeedback(
					enrichment,
					result.leadId,
					clientId,
					message,
					aiSummary,
					aiAnalysisResponseTime
				).catch(() => {
					// Silent failure - don't affect existing functionality
				});
				
				// Send urgent lead alert if high urgency
				if (clientId && result.leadId) {
					sendUrgentLeadAlert({
						id: result.leadId,
						name,
						email,
						message,
						aiSummary,
						intent: enrichment.intent,
						urgency: enrichment.urgency,
						confidence_score: enrichment.confidence_score,
						clientId: clientId,
						timestamp: new Date().toISOString(),
					}).catch((err) => {
						console.error('[EmailAlert] Failed to send alert:', err);
						// Silent failure - don't break lead processing
					});
				}
				
				// Link to client in lead_actions
				if (clientId && result.leadId) {
					console.log('[LeadActions] Linking lead to client in lead_actions table');
					
					const now = new Date().toISOString();
					const actionInsertData = {
						lead_id: result.leadId,
						client_id: clientId,
						action_type: 'insert',
						tag: 'New Lead',
						created_at: now,
						timestamp: now,
						is_test: isTest,
					};
					
					const { error: actionError } = await supabase
						.from('lead_actions')
						.insert(actionInsertData);
					
					if (actionError) {
						console.error('[LeadActions] ❌ Insert failed:', actionError);
					} else {
						console.log('[LeadActions] ✅ Lead linked successfully');
					}
					
					// Generate personalized email for client
					console.log('[EmailAutomation] ============================================');
					console.log('[EmailAutomation] Generating personalized email for client');
					console.log('[EmailAutomation] ============================================');
					
					const { data: client, error: clientError } = await supabase
						.from('clients')
						.select('*')
						.eq('client_id', clientId)
						.single();
					
					if (clientError) {
						console.error('[EmailAutomation] ❌ Failed to fetch client:', clientError);
					} else if (client) {
						console.log('[EmailAutomation] Client loaded:', {
							business_name: client.business_name,
							industry: client.industry_category,
							service: client.primary_service,
							tone: client.email_tone,
							speed: client.followup_speed,
							language: client.language,
							booking_link: client.booking_link || 'none',
							tagline: client.custom_tagline || 'none',
							ai_replies_enabled: client.ai_personalized_reply,
						});
						
						if (client.ai_personalized_reply) {
							try {
								const emailContent = buildPersonalizedHtmlEmail({
									leadName: name,
									leadEmail: email,
									leadMessage: message,
									aiSummary: aiSummary,
									intent: enrichment.intent,
									tone: enrichment.tone,
									urgency: enrichment.urgency,
									confidence: enrichment.confidence_score,
									locale: locale,
									client: client,
								});
								
								console.log('[EmailAutomation] ============================================');
								console.log('[EmailAutomation] ✅ Personalized email generated');
								console.log('[EmailAutomation] ============================================');
								console.log('[EmailAutomation] Sender:', client.outbound_email || `${client.business_name} <noreply@aveniraisolutions.ca>`);
								console.log('[EmailAutomation] Recipient:', email);
								console.log('[EmailAutomation] Language:', locale);
								console.log('[EmailAutomation] Tone:', client.email_tone);
								console.log('[EmailAutomation] Urgency handling:', enrichment.urgency);
								console.log('[EmailAutomation] Industry context:', client.industry_category);
								console.log('[EmailAutomation] Service context:', client.primary_service);
								console.log('[EmailAutomation] Booking link:', client.booking_link || 'Not included');
								console.log('[EmailAutomation] ============================================');
								console.log('[EmailAutomation] 🧪 Email Preview (Development Mode):');
								console.log('[EmailAutomation] ============================================');
								console.log(emailContent.substring(0, 500) + '...');
								console.log('[EmailAutomation] ============================================');
								console.log('[EmailAutomation] 🧪 Email NOT sent (development mode)');
								console.log('[EmailAutomation] In production, this would be sent via:');
								console.log('[EmailAutomation]   - Client SMTP if configured');
								console.log('[EmailAutomation]   - Or relay: mailer@aveniraisolutions.ca');
								console.log('[EmailAutomation] ============================================');
							} catch (emailError) {
								console.error('[EmailAutomation] ❌ Email generation error:', emailError);
							}
						} else {
							console.log('[EmailAutomation] ⚠️  AI personalized replies disabled for this client');
						}
					}
				}
				
				console.log('[Lead API] ============================================');
				console.log('[Lead API] ✅ Development mode processing complete');
				console.log('[Lead API] ============================================');
				
				return new Response(
					JSON.stringify({ 
						success: true, 
						leadId: result.leadId,
						message: 'Lead processed successfully (development mode)',
						note: 'Gmail and Sheets skipped in development'
					}),
					{ status: 200, headers: getCorsHeaders(requestOrigin) }
				);
			} catch (devError) {
				console.error('[Lead API] ❌ Development mode error:', devError);
				return new Response(
					JSON.stringify({ success: false, error: devError instanceof Error ? devError.message : 'Processing failed' }),
					{ status: 500, headers: getCorsHeaders(requestOrigin) }
				);
			}
		}

		// Production mode: Continue with full Gmail/Sheets flow
		let savedVia = "sheets" as "sheets";
		const timestamp = providedTimestamp || new Date().toISOString();
		try {
			const credsEnv = process.env.GOOGLE_CREDENTIALS_JSON;
			if (!credsEnv) {
				throw new Error("Missing GOOGLE_CREDENTIALS_JSON env var");
			}
			let credentials: unknown;
			try {
				credentials = JSON.parse(credsEnv);
			} catch {
				throw new Error("GOOGLE_CREDENTIALS_JSON is not valid JSON");
			}
			const auth = new google.auth.GoogleAuth({
				credentials: credentials as any,
				scopes: ["https://www.googleapis.com/auth/spreadsheets"],
			});
			const sheets = google.sheets({ version: "v4", auth });
			const appendRes = await retry(async () => await sheets.spreadsheets.values.append({
				spreadsheetId,
				range: sheetRange,
				valueInputOption: "USER_ENTERED",
				requestBody: { values: [[name, email, message, timestamp]] },
			}), { maxAttempts: 5, baseMs: 200 });

			// Summarize and score via OpenAI
			if (!process.env.OPENAI_API_KEY) {
				throw new Error("Missing OPENAI_API_KEY env var");
			}
			const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
			const isFrench = locale === 'fr';
			const prompt = isFrench 
				? `Vous êtes un assistant commercial pour Avenir AI Solutions. Lisez ce message de prospect et produisez un résumé concis de leur intention (≤ 30 mots) et un score de confiance de 0 à 100 sur la probabilité qu'ils soient un prospect qualifié.\n\nRetournez SEULEMENT du JSON avec les champs : {\n  "summary": string,\n  "confidence": number\n}\n\nMessage du prospect :\n${message}`
				: `You are a sales assistant for Avenir AI Solutions. Read this lead message and produce a concise summary of their intent (<= 30 words) and a confidence score from 0 to 100 about how likely they are a qualified lead.\n\nReturn ONLY JSON with fields: {\n  "summary": string,\n  "confidence": number\n}\n\nLead message:\n${message}`;
			const ai = await retry(async () => await openai.chat.completions.create({
				model: "gpt-4o-mini",
				messages: [
					{ role: "system", content: "You format outputs as strict JSON without extra text." },
					{ role: "user", content: prompt },
				],
				temperature: 0.2,
			}), { maxAttempts: 3, baseMs: 300 });
			let aiSummary = "";
			let aiConfidence: number | null = null;
			try {
				const raw = ai.choices?.[0]?.message?.content ?? "";
				const parsed = JSON.parse(raw);
				aiSummary = (parsed?.summary ?? "").toString();
				const c = Number(parsed?.confidence);
				aiConfidence = Number.isFinite(c) ? Math.max(0, Math.min(100, Math.round(c))) : null;
			} catch {
				aiSummary = "";
				aiConfidence = null;
			}

			// Determine the appended row index
			const updatedRange = appendRes.data.updates?.updatedRange; // e.g., "Sheet1!A123:D123"
			if (!updatedRange) {
				throw new Error("Unable to determine appended row range from Sheets response");
			}
			const rowMatch = updatedRange.match(/!(?:[A-Z]+)(\d+):/);
			const rowNumber = rowMatch ? parseInt(rowMatch[1], 10) : NaN;
			if (!Number.isFinite(rowNumber)) {
				throw new Error("Failed parsing appended row number");
			}

			// Write AI Summary (E) and Confidence (F)
			const targetRange = `Sheet1!E${rowNumber}:F${rowNumber}`;
			await retry(async () => await sheets.spreadsheets.values.update({
				spreadsheetId,
				range: targetRange,
				valueInputOption: "USER_ENTERED",
				requestBody: { values: [[aiSummary, aiConfidence ?? ""]] },
			}), { maxAttempts: 5, baseMs: 200 });

			// Run AI enrichment BEFORE sending email to get urgency/intent data
			console.log('[Lead API] Running AI enrichment for email personalization...');
			let enrichment: { intent: string; tone: string; urgency: string; confidence_score: number } | null = null;
			try {
				enrichment = await enrichLeadWithAI({
					message,
					aiSummary,
					language: locale,
				});
				console.log('[Lead API] ✅ Enrichment complete for email:', {
					intent: enrichment.intent,
					urgency: enrichment.urgency,
					tone: enrichment.tone,
				});
			} catch (enrichError) {
				console.error('[Lead API] ⚠️ Enrichment failed, using defaults:', enrichError);
				enrichment = {
					intent: 'General Information',
					tone: 'Professional',
					urgency: 'Medium',
					confidence_score: 0.75,
				};
			}

			// Send follow-up email via Gmail (skip in development mode)
			const isDevMode = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
			if (isDevMode) {
				console.log('[Lead API] 🧪 Skipping Gmail send (development mode)');
				console.log('[Lead API] Environment: development');
				console.log('[Lead API] Email would have been sent to:', email);
				console.log('[Lead API] Continuing with AI enrichment and storage...');
			} else {
				try {
					const gmail = await getAuthorizedGmail();
					
					// Force refresh Gmail profile to get current sender identity and avatar
					const profile = await retry(async () => await gmail.users.getProfile({ userId: 'me' }), { maxAttempts: 3, baseMs: 200 });
					const profileEmail = profile.data?.emailAddress || process.env.GMAIL_FROM_ADDRESS || "contact@aveniraisolutions.ca";
					
					console.log('Using Gmail profile for sender identity:', {
						email: profile.data?.emailAddress,
						messagesTotal: profile.data?.messagesTotal,
						threadsTotal: profile.data?.threadsTotal
					});
					
					// Create Avenir AI client record for personalized email
					const avenirClient: ClientRecord = {
						business_name: "Avenir AI Solutions",
						email: "contact@aveniraisolutions.ca",
						industry_category: "AI & Automation",
						primary_service: "AI Growth Infrastructure",
						email_tone: "Professional",
						followup_speed: "Instant",
						language: locale,
						custom_tagline: "Building intelligent infrastructures that think and grow",
						booking_link: "https://calendar.app.google/D8jVdpaxAC62PV6m9",
						ai_personalized_reply: true,
						// Add default fields for personalized email
						client_id: 'avenirai-website',
						api_key: '',
						created_at: new Date().toISOString(),
						updated_at: new Date().toISOString(),
						outbound_email: "contact@aveniraisolutions.ca",
					};
					
					const raw = buildPersonalizedHtmlEmail({
						leadName: name,
						leadEmail: email,
						leadMessage: message,
						aiSummary: aiSummary || "",
						urgency: enrichment.urgency,
						confidence: enrichment.confidence_score,
						locale: locale,
						client: avenirClient,
					});
					
					// Send with explicit reference to current profile
					await retry(async () => await gmail.users.messages.send({
						userId: "me",
						requestBody: { raw },
					}), { maxAttempts: 5, baseMs: 300 });
					
					console.log('[Lead API] ✅ Email sent successfully');
				} catch (mailErr) {
					console.error("[Lead API] ❌ Gmail send error:", mailErr);
				}
			}

			// AI Intelligence Layer + Historical Tracking: Analyze and store/update lead
			try {
				console.log('[Lead API] ============================================');
				console.log('[Lead API] Starting AI Intelligence & Storage');
				console.log('[Lead API] ============================================');
				console.log('[AI Intelligence] Using enrichment data already computed for email...');
				
				// Track AI analysis timing for feedback logging (we already computed this above)
				const aiAnalysisStartTime = Date.now();
				const aiAnalysisResponseTime = 100; // Approximate since already computed
				
				console.log('[AI Intelligence] ✅ Enrichment complete:', {
					intent: enrichment.intent,
					tone: enrichment.tone,
					urgency: enrichment.urgency,
					confidence: enrichment.confidence_score,
				});
				
				// Detect if this is test data
				const isTest = isTestLead({ name, email, message });
				logTestDetection('Lead submission', isTest,
					isTest ? 'Contains test keywords or example domain' : undefined);
				
				// Upsert lead with historical tracking
				console.log('[AI Intelligence] ============================================');
				console.log('[AI Intelligence] Calling upsertLeadWithHistory()...');
				console.log('[AI Intelligence] ============================================');
				
				const upsertParams = {
					email,
					name,
					message,
					ai_summary: aiSummary || null,
					language: locale,
					timestamp,
					intent: enrichment.intent,
					tone: enrichment.tone,
					urgency: enrichment.urgency,
					confidence_score: enrichment.confidence_score,
					client_id: clientId,
					is_test: isTest,
				};
				
				console.log('[E2E-Test] [LeadAPI] Upsert params prepared:', {
					email: upsertParams.email,
					name: upsertParams.name,
					language: upsertParams.language,
					intent: upsertParams.intent,
					tone: upsertParams.tone,
					urgency: upsertParams.urgency,
					confidence_score: upsertParams.confidence_score,
					client_id: upsertParams.client_id || 'null (internal)',
					message_length: upsertParams.message.length,
					ai_summary_length: upsertParams.ai_summary?.length || 0,
				});
				
				const result = await upsertLeadWithHistory(upsertParams);
				
				console.log('[AI Intelligence] ============================================');
				console.log('[AI Intelligence] upsertLeadWithHistory() completed');
				console.log('[AI Intelligence] ============================================');
				console.log('[AI Intelligence] Result:', {
					isNew: result.isNew,
					leadId: result.leadId,
					hasInsight: !!result.insight,
					insight: result.insight || 'none',
				});
				
				// Log AI analysis feedback silently in the background (complete isolation)
				logAiAnalysisFeedback(
					enrichment,
					result.leadId,
					clientId,
					message,
					aiSummary,
					aiAnalysisResponseTime
				).catch(() => {
					// Silent failure - don't affect existing functionality
				});
				
				if (result.isNew) {
					console.log('[AI Intelligence] ✅ New lead created:', result.leadId);
				} else {
					console.log('[AI Intelligence] ✅ Existing lead updated:', result.leadId);
					if (result.insight) {
						console.log('[AI Intelligence] 📊 Relationship insight:', result.insight);
					}
				}
				
				// If this lead is from a client (has client_id), create a record in lead_actions
				if (clientId && result.leadId) {
					console.log('[LeadActions] ============================================');
					console.log('[LeadActions] Linking lead to client in lead_actions table');
					console.log('[LeadActions] lead_id:', result.leadId);
					console.log('[LeadActions] client_id:', clientId);
					
					const now = new Date().toISOString();
					const actionInsertData = {
						lead_id: result.leadId,
						client_id: clientId,
						action_type: 'insert',
						tag: 'New Lead',
						created_at: now,
						timestamp: now,
						is_test: isTest,
					};
					
					console.log('[LeadActions] Preparing insert into lead_actions:', {
						lead_id: actionInsertData.lead_id,
						client_id: actionInsertData.client_id,
						action_type: actionInsertData.action_type,
						tag: actionInsertData.tag,
					});
					
					const { data: actionRecord, error: actionError } = await supabase
						.from('lead_actions')
						.insert(actionInsertData)
						.select()
						.single();
					
					if (actionError) {
						console.error('[LeadActions] ❌ Insert failed');
						console.error('[LeadActions] ❌ Supabase error:', {
							message: actionError.message,
							code: actionError.code,
							hint: actionError.hint,
							details: actionError.details,
						});
						console.warn('[LeadActions] ⚠️  Lead created but NOT linked to client');
					} else {
						console.log('[LeadActions] ✅ Insert success');
						console.log('[LeadActions] ✅ Lead linked to client_id:', actionRecord.client_id, 'with lead_id:', actionRecord.lead_id);
						console.log('[LeadActions] ✅ Action record created with ID:', actionRecord.id);
						console.log('[LeadActions] ✅ Client will see this lead in dashboard');
					}
					console.log('[LeadActions] ============================================');
				}
				
				if (clientId) {
					console.log(`[E2E-Test] [LeadAPI] ✅ Lead processed with client_id: ${clientId}`);
					console.log(`[E2E-Test] [LeadAPI] ✅ Stored lead successfully for client`);
					console.log(`[E2E-Test] [LeadAPI] ✅ Lead ID: ${result.leadId}`);
				} else {
					console.log('[E2E-Test] [LeadAPI] Lead processed (internal - website form)');
				}
				
				console.log('[Lead API] ============================================');
				console.log('[Lead API] ✅ AI Intelligence & Storage COMPLETE');
				console.log('[Lead API] ============================================');
				
			} catch (enrichError) {
				// non-fatal: log for debugging but don't break the flow
				console.error('[Lead API] ============================================');
				console.error('[Lead API] ❌ AI Intelligence/Storage FAILED');
				console.error('[Lead API] ============================================');
				console.error('[AI Intelligence] Error type:', enrichError instanceof Error ? enrichError.constructor.name : typeof enrichError);
				console.error('[AI Intelligence] Error message:', enrichError instanceof Error ? enrichError.message : String(enrichError));
				console.error('[AI Intelligence] Error stack:', enrichError instanceof Error ? enrichError.stack : 'N/A');
			console.error('[AI Intelligence] Full error object:', enrichError);
			console.error('[Lead API] ============================================');
			console.warn('[AI Intelligence] Continuing without enrichment (non-fatal)');
		}

		console.log('[Lead API] ============================================');
		console.log('[Lead API] ✅ Lead processing COMPLETE');
		console.log('[Lead API] Storage:', savedVia);
		console.log('[Lead API] ============================================');
		
		return new Response(
			JSON.stringify({ success: true, storage: savedVia, action: "inserted" }),
			{ status: 200, headers: getCorsHeaders(requestOrigin) }
		);
	} catch (sheetsError) {
			const msg = sheetsError instanceof Error ? sheetsError.message : "Failed to append to Google Sheet";
			console.error('[Lead API] ❌ Google Sheets error:', msg);
			return new Response(
				JSON.stringify({ success: false, error: msg }),
				{ status: 500, headers: getCorsHeaders(requestOrigin) }
		);
	}
} catch (error) {
	return handleApiError(error, 'Lead API', requestOrigin);
}
}

// Use Node.js runtime for fs access
export const runtime = "nodejs";

