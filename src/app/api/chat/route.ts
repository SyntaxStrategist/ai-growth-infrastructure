import OpenAI from "openai";
import { NextRequest } from "next/server";

import { handleApiError } from '../../../lib/error-handler';
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(() => null);
		if (!body || typeof body !== "object") {
			return new Response(
				JSON.stringify({ error: "Invalid JSON body" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		const { messages, model } = body as {
			messages?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
			model?: string;
		};

		if (!messages || !Array.isArray(messages) || messages.length === 0) {
			return new Response(
				JSON.stringify({ error: "'messages' must be a non-empty array" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		if (!process.env.OPENAI_API_KEY) {
			return new Response(
				JSON.stringify({ error: "Missing OPENAI_API_KEY server environment variable" }),
				{ status: 500, headers: { "Content-Type": "application/json" } }
			);
		}

		const response = await openai.chat.completions.create({
			model: model || "gpt-4o-mini",
			messages,
		});

		const choice = response.choices?.[0];
		return new Response(
			JSON.stringify({
				id: response.id,
				model: response.model,
				created: response.created,
				message: choice?.message ?? null,
				usage: response.usage ?? null,
			}),
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

export const runtime = "edge";

