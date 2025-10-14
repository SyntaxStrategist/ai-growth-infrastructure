/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-const, @typescript-eslint/prefer-as-const */
import { NextRequest } from "next/server";
import { google } from "googleapis";
import OpenAI from "openai";
import { getAuthorizedGmail, buildHtmlEmail } from "../../../lib/gmail";
import { saveLeadToSupabase, enrichLeadInDatabase, validateApiKey } from "../../../lib/supabase";
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
		// Check for API key authentication
		const apiKey = req.headers.get('x-api-key');
		let clientId: string | null = null;
		
		if (apiKey) {
			// Validate API key for external clients
			const client = await validateApiKey(apiKey);
			if (!client) {
				console.log('[API] Invalid API key provided');
				return new Response(
					JSON.stringify({ error: "Unauthorized: Invalid API key" }),
					{ status: 401, headers: { "Content-Type": "application/json" } }
				);
			}
			clientId = client.id;
			console.log(`[API] Authenticated request from client: ${client.company_name}`);
		} else {
			// No API key = internal request (from website form)
			console.log('[API] Internal request (no API key)');
		}
		
		const body = (await req.json().catch(() => null)) as LeadPayload | null;
		if (!body || typeof body !== "object") {
			return new Response(
				JSON.stringify({ error: "Invalid JSON body" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		const name = (body.name || "").toString().trim();
		const email = (body.email || "").toString().trim();
		const message = (body.message || "").toString().trim();
		const providedTimestamp = (body.timestamp || "").toString().trim();
		const locale = (body.locale || "en").toString().trim();

		if (!name || !email || !message) {
			return new Response(
				JSON.stringify({ error: "'name', 'email', and 'message' are required" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		// very light email validation
		const emailOk = /.+@.+\..+/.test(email);
		if (!emailOk) {
			return new Response(
				JSON.stringify({ error: "Please provide a valid email" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

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

			// Store lead in growth memory database via Supabase REST API
			let leadId: string | undefined;
			try {
				const savedRecord = await saveLeadToSupabase({
					name,
					email,
					message,
					aiSummary: aiSummary || null,
					language: locale,
					timestamp,
					clientId,
				});
				
				leadId = savedRecord?.id;
				if (clientId) {
					console.log(`[Lead API] Lead saved to database with client_id: ${clientId}`);
				} else {
					console.log('[Lead API] Lead saved to database (internal)');
				}
			} catch {
				// non-fatal: log for debugging but don't break the flow
				console.warn('[Lead API] Database save failed');
			}

			// AI Intelligence Layer: Enrich lead with intent, tone, urgency
			if (leadId && aiSummary) {
				try {
					console.log('[AI Intelligence] Analyzing lead...');
					
					const enrichment = await enrichLeadWithAI({
						message,
						aiSummary,
						language: locale,
					});
					
					await enrichLeadInDatabase({
						id: leadId,
						intent: enrichment.intent,
						tone: enrichment.tone,
						urgency: enrichment.urgency,
						confidence_score: enrichment.confidence_score,
					});
					
					console.log('[AI Intelligence] Lead enriched:', {
						intent: enrichment.intent,
						urgency: enrichment.urgency,
						confidence: enrichment.confidence_score,
					});
				} catch {
					// non-fatal
					console.warn('[AI Intelligence] Enrichment failed');
				}
			}
		} catch (sheetsError) {
			const msg = sheetsError instanceof Error ? sheetsError.message : "Failed to append to Google Sheet";
			return new Response(
				JSON.stringify({ error: msg }),
				{ status: 500, headers: { "Content-Type": "application/json" } }
			);
		}

		return new Response(
			JSON.stringify({ success: true, storage: savedVia }),
			{ status: 200, headers: { "Content-Type": "application/json" } }
		);
	} catch (error) {
		const message = error instanceof Error ? error.message : "Unknown error";
		return new Response(
			JSON.stringify({ error: message }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
}

// Use Node.js runtime for fs access
export const runtime = "nodejs";

