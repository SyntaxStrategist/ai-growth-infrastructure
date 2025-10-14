#!/bin/bash
set -e

echo "Running Prisma migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "Warning: DATABASE_URL is not set. Skipping migrations."
  exit 0
fi

# Ensure SSL mode is set for Supabase connections
if [[ "$DATABASE_URL" == *"supabase.co"* ]] && [[ "$DATABASE_URL" != *"sslmode="* ]]; then
  if [[ "$DATABASE_URL" == *"?"* ]]; then
    export DATABASE_URL="${DATABASE_URL}&sslmode=require"
  else
    export DATABASE_URL="${DATABASE_URL}?sslmode=require"
  fi
  echo "Added sslmode=require to DATABASE_URL"
fi

# Generate Prisma Client
echo "Generating Prisma Client..."
npx prisma generate

# Deploy migrations with retry logic
echo "Deploying migrations..."
MAX_RETRIES=3
RETRY_COUNT=0

until npx prisma migrate deploy || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  RETRY_COUNT=$((RETRY_COUNT+1))
  echo "Migration attempt $RETRY_COUNT failed. Retrying in 2 seconds..."
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Error: Failed to deploy migrations after $MAX_RETRIES attempts"
  exit 1
fi

echo "Migrations completed successfully!"

