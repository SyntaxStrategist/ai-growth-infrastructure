/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/prefer-nullish-coalescing */
/* eslint-disable @typescript-eslint/prefer-optional-chain */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { google } from "googleapis";
import { kv } from "@vercel/kv";
import crypto from "crypto";

const KV_TOKEN_KEY = process.env.GMAIL_TOKENS_KV_KEY || "gmail:oauth:tokens";
const ENCRYPTION_KEY = process.env.GMAIL_ENCRYPTION_KEY || "default-key-change-in-production";

export function encrypt(text: string): string {
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

function decrypt(encryptedText: string): string {
  const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function getOAuth2Client() {
  const clientId = process.env.GMAIL_CLIENT_ID || "";
  const clientSecret = process.env.GMAIL_CLIENT_SECRET || "";
  const redirectUri = process.env.GMAIL_REDIRECT_URI || "";
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Missing Gmail OAuth env vars (GMAIL_CLIENT_ID/SECRET/REDIRECT_URI)");
  }
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  return oauth2Client;
}

export async function getStoredTokens(): Promise<any | null> {
  // Try encrypted env var first (most reliable for Vercel)
  try {
    const encryptedTokens = process.env.GMAIL_REFRESH_TOKEN;
    if (encryptedTokens) {
      const decrypted = decrypt(encryptedTokens);
      return JSON.parse(decrypted);
    }
  } catch {
    // ignore and try KV fallback
  }
  
  // Fallback to KV
  try {
    if (kv) {
      const t = await kv.get<string>(KV_TOKEN_KEY);
      if (t) return JSON.parse(t);
    }
  } catch {
    // ignore
  }
  
  // Last resort: plain env var
  try {
    const envTokens = process.env.GMAIL_TOKENS_JSON;
    if (envTokens) return JSON.parse(envTokens);
  } catch {
    // ignore
  }
  return null;
}

export async function storeTokens(tokens: any) {
  const serialized = JSON.stringify(tokens);
  if (!serialized) return;
  
  // Encrypt and store in env var (for Vercel compatibility)
  try {
    const encrypted = encrypt(serialized);
    // Note: In production, you'd need to update the env var via Vercel API
    // For now, we'll store in KV as backup
    if (kv) {
      await kv.set(KV_TOKEN_KEY, serialized);
    }
    // Log the encrypted token for manual env var update
    console.log(`GMAIL_REFRESH_TOKEN=${encrypted}`);
  } catch {
    // ignore
  }
}

export function getAuthUrl() {
  const oauth2Client = getOAuth2Client();
  const scopes = [
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile",
    "openid",
  ];
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
  });
}

export async function getAuthorizedGmail() {
  const oauth2Client = getOAuth2Client();
  const tokens = await getStoredTokens();
  if (!tokens) {
    throw new Error("Gmail not connected. Visit /api/gmail/auth to authorize");
  }
  oauth2Client.setCredentials(tokens);
  return google.gmail({ version: "v1", auth: oauth2Client });
}

export function toBase64Url(input: string) {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function buildHtmlEmail(opts: { to: string; from: string; subject: string; name: string; aiSummary: string; }) {
  const { to, from, subject, name, aiSummary } = opts;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8" />
  <meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light">
  <style>
    body { margin:0; padding:0; background:#0a0a0a; color:#eaeaea; font-family:Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
    .container { max-width:640px; margin:0 auto; padding:24px; }
    .badge { display:inline-block; padding:6px 10px; border-radius:9999px; border:1px solid rgba(255,255,255,0.18); font-size:12px; opacity:.9; }
    .h1 { font-size:24px; line-height:1.2; margin:16px 0 8px; }
    .card { border:1px solid rgba(255,255,255,0.14); border-radius:12px; padding:16px; background:linear-gradient(135deg, rgba(139,92,246,0.08), rgba(6,182,212,0.08)); }
    .muted { color:#bdbdbd; font-size:14px; }
    .gradient { background: linear-gradient(135deg, #8b5cf6, #06b6d4); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    a { color:#06b6d4; }
  </style></head><body>
  <div class="container">
    <div class="badge">Avenir AI Solutions</div>
    <h1 class="h1">Thanks, <span class="gradient">${name}</span> — we got your request</h1>
    <p class="muted">An Avenir strategist will reach out shortly. Meanwhile, here’s an AI summary of your goals:</p>
    <div class="card"><strong>AI Summary</strong><div style="margin-top:6px; white-space:pre-wrap;">${escapeHtml(aiSummary || "(unavailable)")}</div></div>
    <p class="muted" style="margin-top:16px;">If this wasn’t you, please ignore this email.</p>
  </div></body></html>`;

  const headers = [
    `From: Avenir AI Solutions <${from}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=UTF-8",
  ].join("\r\n");

  const raw = `${headers}\r\n\r\n${html}`;
  return toBase64Url(raw);
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


