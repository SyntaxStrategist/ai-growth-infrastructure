/**
 * Test Script for RLS Policies
 * This script tests the Row Level Security policies for outreach tables
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRLSPolicies() {
  console.log('🧪 Testing RLS Policies for Outreach Tables...\n');

  try {
    // Test 1: Service role should have full access
    console.log('Test 1: Service role full access');
    const { data: templates, error: templatesError } = await supabase
      .from('email_templates')
      .select('*');
    
    if (templatesError) {
      console.error('❌ Service role access failed:', templatesError.message);
    } else {
      console.log('✅ Service role can access all templates:', templates.length);
    }

    // Test 2: Set client context and test client access
    console.log('\nTest 2: Client context access');
    const testClientId = 'test-client-123';
    
    // Set client context
    const { error: contextError } = await supabase.rpc('set_client_context', {
      client_id_param: testClientId
    });
    
    if (contextError) {
      console.error('❌ Failed to set client context:', contextError.message);
    } else {
      console.log('✅ Client context set successfully');
    }

    // Test 3: Create a template for the test client
    console.log('\nTest 3: Create template for test client');
    const { data: newTemplate, error: createError } = await supabase
      .from('email_templates')
      .insert({
        name: 'Test Template',
        subject_template: 'Test Subject',
        html_template: '<p>Test HTML</p>',
        text_template: 'Test Text',
        client_id: testClientId
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Failed to create template:', createError.message);
    } else {
      console.log('✅ Template created successfully:', newTemplate.id);
    }

    // Test 4: Read templates (should only see own templates)
    console.log('\nTest 4: Read templates with client context');
    const { data: clientTemplates, error: readError } = await supabase
      .from('email_templates')
      .select('*');
    
    if (readError) {
      console.error('❌ Failed to read templates:', readError.message);
    } else {
      console.log('✅ Client can read templates:', clientTemplates.length);
      console.log('   Templates belong to client:', clientTemplates.every(t => t.client_id === testClientId || t.client_id === null));
    }

    // Test 5: Try to access another client's data (should fail)
    console.log('\nTest 5: Test access control');
    const { data: otherClientTemplates, error: otherError } = await supabase
      .from('email_templates')
      .select('*')
      .neq('client_id', testClientId)
      .not('client_id', 'is', null);
    
    if (otherError) {
      console.log('✅ Access control working - cannot access other client data:', otherError.message);
    } else {
      console.log('❌ Access control failed - can access other client data:', otherClientTemplates.length);
    }

    // Test 6: Update own template
    console.log('\nTest 6: Update own template');
    if (newTemplate) {
      const { data: updatedTemplate, error: updateError } = await supabase
        .from('email_templates')
        .update({ name: 'Updated Test Template' })
        .eq('id', newTemplate.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('❌ Failed to update template:', updateError.message);
      } else {
        console.log('✅ Template updated successfully');
      }
    }

    // Test 7: Delete own template
    console.log('\nTest 7: Delete own template');
    if (newTemplate) {
      const { error: deleteError } = await supabase
        .from('email_templates')
        .delete()
        .eq('id', newTemplate.id);
      
      if (deleteError) {
        console.error('❌ Failed to delete template:', deleteError.message);
      } else {
        console.log('✅ Template deleted successfully');
      }
    }

    // Test 8: Test outreach campaigns table
    console.log('\nTest 8: Test outreach campaigns table');
    const { data: campaigns, error: campaignsError } = await supabase
      .from('outreach_campaigns')
      .select('*');
    
    if (campaignsError) {
      console.error('❌ Failed to access campaigns:', campaignsError.message);
    } else {
      console.log('✅ Can access campaigns table:', campaigns.length);
    }

    console.log('\n🎉 RLS Policy Testing Complete!');

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the tests
testRLSPolicies().then(() => {
  console.log('\n✨ All tests completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test suite failed:', error);
  process.exit(1);
});
