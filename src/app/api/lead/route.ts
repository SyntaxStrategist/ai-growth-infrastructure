import { NextRequest } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { google } from "googleapis";

type LeadPayload = {
	name?: string;
	email?: string;
	message?: string;
	timestamp?: string; // ISO string from client; if missing, server will set
};

const dataDir = path.join(process.cwd(), "data");
const leadsFile = path.join(dataDir, "leads.json");

// Google Sheets config
const spreadsheetId = "1Zlkx2lDsLIz594ALHOCQNs7byMAaAXcj_wyZSp67GEA"; // provided by user
const sheetRange = "Sheet1!A:D"; // [Name, Email, Message, Timestamp]

async function ensureDataFile() {
	try {
		await fs.mkdir(dataDir, { recursive: true });
		await fs.access(leadsFile).catch(async () => {
			await fs.writeFile(leadsFile, JSON.stringify([], null, 2), "utf8");
		});
	} catch {
		// swallow; will be handled during write
	}
}

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

		// Try Google Sheets first; if misconfigured, fall back to local JSON storage
		let savedVia = "sheets" as "sheets" | "file";
		const timestamp = providedTimestamp || new Date().toISOString();
		try {
			if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
				throw new Error("Missing GOOGLE_APPLICATION_CREDENTIALS env var");
			}
			const auth = await google.auth.getClient({
				scopes: ["https://www.googleapis.com/auth/spreadsheets"],
			});
			const sheets = google.sheets({ version: "v4", auth });
			await sheets.spreadsheets.values.append({
				spreadsheetId,
				range: sheetRange,
				valueInputOption: "USER_ENTERED",
				requestBody: { values: [[name, email, message, timestamp]] },
			});
			savedVia = "sheets";
		} catch (sheetsError) {
			// Fallback to local file if Sheets write fails
			savedVia = "file";
			await ensureDataFile();
			let existing: unknown = [];
			try {
				existing = JSON.parse(await fs.readFile(leadsFile, "utf8"));
			} catch {
				existing = [];
			}
			const leads = Array.isArray(existing) ? existing : [];
			const entry = {
				id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
				name,
				email,
				message,
				createdAt: timestamp,
			};
			leads.push(entry);
			await fs.writeFile(leadsFile, JSON.stringify(leads, null, 2), "utf8");
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

