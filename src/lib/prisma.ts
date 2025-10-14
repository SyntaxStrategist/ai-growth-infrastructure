import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Ensure DATABASE_URL has SSL mode for Supabase
const getDatabaseUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) return url;
  
  // Add sslmode=require if not present and it's a Supabase connection
  if (url.includes('supabase.co') && !url.includes('sslmode=')) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}sslmode=require`;
  }
  
  return url;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Ensure table exists at runtime (for Vercel/Supabase compatibility)
export const ensureLeadMemoryTable = async () => {
  try {
    console.log('[Prisma] Checking database connection...');
    console.log('[Prisma] DATABASE_URL configured:', !!process.env.DATABASE_URL);
    console.log('[Prisma] Connection URL format:', process.env.DATABASE_URL?.substring(0, 30) + '...');
    
    // Test connection first
    await prisma.$connect();
    console.log('[Prisma] ✅ Database connection successful');
    
    // Create table if not exists
    console.log('[Prisma] Ensuring LeadMemory table exists...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "lead_memory" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "aiSummary" TEXT,
        "language" TEXT NOT NULL DEFAULT 'en',
        "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "lead_memory_pkey" PRIMARY KEY ("id")
      );
    `);
    console.log('[Prisma] ✅ LeadMemory table ensured');
    
    // Create indexes if they don't exist
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "lead_memory_timestamp_idx" ON "lead_memory"("timestamp");
    `);
    console.log('[Prisma] ✅ Timestamp index ensured');
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "lead_memory_email_idx" ON "lead_memory"("email");
    `);
    console.log('[Prisma] ✅ Email index ensured');
    
    return true;
  } catch (err) {
    console.error('[Prisma] ❌ Failed to ensure LeadMemory table:', err);
    console.error('[Prisma] Error details:', err instanceof Error ? err.message : 'Unknown error');
    return false;
  }
};

// Connect with retry logic (non-blocking)
const connectWithRetry = async (retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
      return;
    } catch (err) {
      console.error(`Database connection attempt ${i + 1} failed:`, err);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  console.error('Failed to connect to database after retries');
};

connectWithRetry().catch(() => {
  // Non-fatal, will retry on first query
});

