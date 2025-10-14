import { NextRequest } from "next/server";
import { prisma, ensureLeadMemoryTable } from "../../../lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Optional: Add authentication check here in production
    // For now, we'll return leads with basic security
    
    // Ensure table exists at runtime
    await ensureLeadMemoryTable();
    
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Fetch recent leads from the database
    const leads = await prisma.leadMemory.findMany({
      take: Math.min(limit, 100), // Max 100 leads per request
      skip: offset,
      orderBy: {
        timestamp: 'desc',
      },
      select: {
        id: true,
        name: true,
        email: true,
        message: true,
        aiSummary: true,
        language: true,
        timestamp: true,
      },
    });

    const total = await prisma.leadMemory.count();

    return new Response(
      JSON.stringify({
        success: true,
        data: leads,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + leads.length < total,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch leads";
    console.error("leads_fetch_error", error);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export const runtime = "nodejs";

