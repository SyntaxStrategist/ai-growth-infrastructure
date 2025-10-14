import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    
    if (!body || typeof body !== "object") {
      return new Response(
        JSON.stringify({ error: "Invalid request" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { password } = body as { password?: string };
    const correctPassword = process.env.ADMIN_DASHBOARD_PASSWORD || "AvenirAI2025";

    if (!password || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ success: false, authorized: false }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Case-sensitive comparison
    if (password === correctPassword) {
      return new Response(
        JSON.stringify({ success: true, authorized: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, authorized: false }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Authentication failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const runtime = "edge";

