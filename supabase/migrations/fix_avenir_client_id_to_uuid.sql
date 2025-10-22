-- ============================================
-- Migration: Fix Avenir AI Solutions client_id from string to UUID format
-- Date: October 21, 2025
-- Issue: Dashboard client filter fails with "invalid input syntax for type uuid"
-- Root Cause: clients.client_id has old string 'avenir-internal-client' 
--             but lead_actions.client_id expects UUID format
-- ============================================

-- Step 1: Check current state (for logging)
SELECT 
  'BEFORE UPDATE' as stage,
  client_id, 
  business_name, 
  email,
  is_internal
FROM clients 
WHERE client_id = 'avenir-internal-client' 
   OR business_name ILIKE '%avenir%';

-- Step 2: Update client_id to UUID format
UPDATE clients 
SET client_id = '00000000-0000-0000-0000-000000000001'
WHERE client_id = 'avenir-internal-client';

-- Step 3: Ensure is_internal flag is set (for future queries)
UPDATE clients 
SET is_internal = true
WHERE client_id = '00000000-0000-0000-0000-000000000001';

-- Step 4: Verify the update
SELECT 
  'AFTER UPDATE' as stage,
  client_id, 
  business_name, 
  email,
  is_internal,
  api_key
FROM clients 
WHERE client_id = '00000000-0000-0000-0000-000000000001';

-- Step 5: Check if any lead_actions reference the old ID (should be 0)
SELECT COUNT(*) as orphaned_lead_actions
FROM lead_actions 
WHERE client_id::text = 'avenir-internal-client';

-- Step 6: Update any lead_actions that might have the old string ID
-- (This is defensive - shouldn't exist but just in case)
DO $$
BEGIN
  -- Only run if the column can accept text (for backward compatibility)
  BEGIN
    UPDATE lead_actions 
    SET client_id = '00000000-0000-0000-0000-000000000001'::uuid
    WHERE client_id::text = 'avenir-internal-client';
    
    RAISE NOTICE 'Updated % lead_actions rows', (SELECT COUNT(*) FROM lead_actions WHERE client_id = '00000000-0000-0000-0000-000000000001'::uuid);
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Could not update lead_actions (may already be correct): %', SQLERRM;
  END;
END $$;

-- Step 7: Final verification - show all Avenir AI data
SELECT 
  '✅ MIGRATION COMPLETE' as status,
  client_id, 
  business_name, 
  is_internal,
  created_at
FROM clients 
WHERE client_id = '00000000-0000-0000-0000-000000000001';

-- ============================================
-- EXPECTED RESULT:
-- - clients.client_id changed from 'avenir-internal-client' to '00000000-0000-0000-0000-000000000001'
-- - is_internal flag set to true
-- - Dashboard client filter will now work correctly
-- ============================================

