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

// Ensure connection on first use with retry logic
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

