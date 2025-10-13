import { NextRequest } from "next/server";
import { getOAuth2Client, storeTokens } from "../../../../lib/gmail";
import { google } from "googleapis";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    if (!code) {
      return new Response(JSON.stringify({ error: "Missing code" }), { status: 400, headers: { "Content-Type": "application/json" } });
    }
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    await storeTokens(tokens);
    
    // Log the encrypted refresh token for manual env var update
    const { encrypt } = await import("../../../../lib/gmail");
    const serialized = JSON.stringify(tokens);
    const encrypted = encrypt(serialized);
    console.log(`GMAIL_REFRESH_TOKEN=${encrypted}`);
    
    // optional: fetch profile
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const me = await oauth2.userinfo.get().catch(() => null);
    const email = me?.data?.email;
    return new Response(JSON.stringify({ success: true, email }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "OAuth callback failed";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export const runtime = "nodejs";

