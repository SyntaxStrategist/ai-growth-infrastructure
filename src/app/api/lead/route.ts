/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const, @typescript-eslint/prefer-as-const */
import { NextRequest } from "next/server";
import { google } from "googleapis";
import OpenAI from "openai";
import { getAuthorizedGmail, buildHtmlEmail } from "../../../lib/gmail";
import { supabase, validateApiKey, upsertLeadWithHistory } from "../../../lib/supabase";
import { enrichLeadWithAI } from "../../../lib/ai-enrichment";

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

async function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
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

export async function POST(req: NextRequest) {
	try {
		console.log('[Lead API] ============================================');
		console.log('[Lead API] POST /api/lead triggered');
		console.log('[Lead API] ============================================');
		console.log('[Lead API] Request headers:', {
			'content-type': req.headers.get('content-type'),
			'x-api-key': req.headers.get('x-api-key') ? 'present' : 'none',
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
					{ status: 401, headers: { "Content-Type": "application/json" } }
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
			// No API key = internal request (from website form)
			console.log('[E2E-Test] [LeadAPI] Internal request (no API key - website form)');
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
				{ status: 400, headers: { "Content-Type": "application/json" } }
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
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		// very light email validation
		const emailOk = /.+@.+\..+/.test(email);
		if (!emailOk) {
			console.error('[Lead API] ❌ Invalid email format:', email);
			return new Response(
				JSON.stringify({ success: false, error: "Please provide a valid email" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}
		
		console.log('[Lead API] ✅ Validation passed - proceeding with lead processing');

		// Append to Google Sheets
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

			// Send follow-up email via Gmail
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
				
				const subject = isFrench 
					? "Merci d'avoir contacté Avenir AI Solutions"
					: "Thanks for contacting Avenir AI Solutions";
				const raw = buildHtmlEmail({ 
					to: email, 
					from: "contact@aveniraisolutions.ca", // Always use the business email
					subject, 
					name, 
					aiSummary: aiSummary || "",
					locale: locale,
					profileEmail: profileEmail // Use profile email for proper sender identity
				});
				
				// Send with explicit reference to current profile
				await retry(async () => await gmail.users.messages.send({
					userId: "me",
					requestBody: { raw },
				}), { maxAttempts: 5, baseMs: 300 });
				
				console.log('Email sent successfully with refreshed sender identity');
			} catch (mailErr) {
				console.error("gmail_send_error", mailErr);
			}

			// AI Intelligence Layer + Historical Tracking: Analyze and store/update lead
			try {
				console.log('[Lead API] ============================================');
				console.log('[Lead API] Starting AI Intelligence & Storage');
				console.log('[Lead API] ============================================');
				console.log('[AI Intelligence] Analyzing lead for enrichment...');
				
				const enrichment = await enrichLeadWithAI({
					message,
					aiSummary,
					language: locale,
				});
				
				console.log('[AI Intelligence] ✅ Enrichment complete:', {
					intent: enrichment.intent,
					tone: enrichment.tone,
					urgency: enrichment.urgency,
					confidence: enrichment.confidence_score,
				});
				
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
		} catch (sheetsError) {
			const msg = sheetsError instanceof Error ? sheetsError.message : "Failed to append to Google Sheet";
			console.error('[Lead API] ❌ Google Sheets error:', msg);
			return new Response(
				JSON.stringify({ success: false, error: msg }),
				{ status: 500, headers: { "Content-Type": "application/json" } }
			);
		}

		console.log('[Lead API] ============================================');
		console.log('[Lead API] ✅ Lead processing COMPLETE');
		console.log('[Lead API] Storage:', savedVia);
		console.log('[Lead API] ============================================');
		
		return new Response(
			JSON.stringify({ success: true, storage: savedVia, action: "inserted" }),
			{ status: 200, headers: { "Content-Type": "application/json" } }
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		console.error('[Lead API] ============================================');
		console.error('[Lead API] ❌ FATAL ERROR');
		console.error('[Lead API] ============================================');
		console.error('[Lead API] Error type:', error instanceof Error ? error.constructor.name : typeof error);
		console.error('[Lead API] Error message:', message);
		console.error('[Lead API] Error stack:', error instanceof Error ? error.stack : 'N/A');
		console.error('[Lead API] Full error object:', error);
		console.error('[Lead API] ============================================');
		
		return new Response(
			JSON.stringify({ success: false, error: message }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
}

// Use Node.js runtime for fs access
export const runtime = "nodejs";

