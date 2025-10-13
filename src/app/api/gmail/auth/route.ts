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
import { NextRequest } from "next/server";
import { getAuthUrl } from "../../../../lib/gmail";

export async function GET(_req: NextRequest) {
  try {
    const url = getAuthUrl();
    return new Response(null, { status: 302, headers: { Location: url } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to generate auth URL";
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}

export const runtime = "nodejs";

