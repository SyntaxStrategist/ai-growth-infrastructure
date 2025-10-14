#!/bin/bash
set -e

echo "Running Prisma migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Warning: DATABASE_URL is not set. Skipping migrations."
  exit 0
fi

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Deploy migrations
echo "Deploying migrations..."
npx prisma migrate deploy

echo "Migrations completed successfully!"

