/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { google } from "googleapis";

type LeadPayload = {
	name?: string;
	email?: string;
	message?: string;
	timestamp?: string; // ISO string from client; if missing, server will set
};

// Google Sheets config
const spreadsheetId = "1Zlkx2lDsLIz594ALHOCQNs7byMAaAXcj_wyZSp67GEA"; // provided by user
const sheetRange = "Sheet1!A:D"; // [Name, Email, Message, Timestamp]

export async function POST(req: NextRequest) {
	try {
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
			await sheets.spreadsheets.values.append({
				spreadsheetId,
				range: sheetRange,
				valueInputOption: "USER_ENTERED",
				requestBody: { values: [[name, email, message, timestamp]] },
			});
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

