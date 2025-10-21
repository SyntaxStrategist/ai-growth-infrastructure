-- Create lead_notes table
CREATE TABLE IF NOT EXISTS "lead_notes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "lead_id" UUID NOT NULL,
    "client_id" UUID,
    "note" TEXT NOT NULL,
    "performed_by" TEXT NOT NULL DEFAULT 'admin',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "is_test" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "lead_notes_pkey" PRIMARY KEY ("id")
);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS "lead_notes_lead_id_idx" ON "lead_notes"("lead_id");
CREATE INDEX IF NOT EXISTS "lead_notes_client_id_idx" ON "lead_notes"("client_id");
CREATE INDEX IF NOT EXISTS "lead_notes_created_at_idx" ON "lead_notes"("created_at");
CREATE INDEX IF NOT EXISTS "lead_notes_is_test_idx" ON "lead_notes"("is_test");

-- Add foreign key constraints
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_lead_id_fkey" FOREIGN KEY ("lead_id") REFERENCES "lead_memory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_notes" ADD CONSTRAINT "lead_notes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_lead_notes_updated_at BEFORE UPDATE ON "lead_notes" FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
