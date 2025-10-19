#!/usr/bin/env node

/**
 * Verify Prompt System Files (Phase 2.2)
 * 
 * This script verifies that all prompt optimization system files
 * have been created and have the correct structure.
 */

const fs = require('fs');
const path = require('path');

function verifyPromptSystemFiles() {
  console.log('🔍 Verifying Prompt System Files (Phase 2.2)...\n');

  const requiredFiles = [
    // Core system files
    'src/lib/prompt-optimizer.ts',
    'src/lib/prompt-registry.ts',
    'src/app/api/prompt-optimization/route.ts',
    
    // Database migration
    'supabase/migrations/20241221_create_prompt_optimization_system.sql',
    
    // Test scripts
    'scripts/test-prompt-optimization.js',
    'scripts/test-prompt-system-components.js',
    'scripts/apply-prompt-optimization-migration.js',
    'scripts/create-prompt-tables.js',
    
    // Documentation
    'PHASE_2_2_PROMPT_OPTIMIZATION_COMPLETE.md'
  ];

  const modifiedFiles = [
    'src/lib/ai-enrichment.ts'
  ];

  let allFilesExist = true;
  let allFilesValid = true;

  console.log('📁 Checking required files...');
  
  for (const file of requiredFiles) {
    const filePath = path.join(__dirname, '..', file);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`   ✅ ${file} (${sizeKB}KB)`);
      
      // Check if file has content
      if (stats.size < 100) {
        console.log(`   ⚠️  ${file} appears to be very small (${stats.size} bytes)`);
        allFilesValid = false;
      }
    } else {
      console.log(`   ❌ ${file} - MISSING`);
      allFilesExist = false;
    }
  }

  console.log('\n📝 Checking modified files...');
  
  for (const file of modifiedFiles) {
    const filePath = path.join(__dirname, '..', file);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const sizeKB = Math.round(stats.size / 1024);
      console.log(`   ✅ ${file} (${sizeKB}KB)`);
      
      // Check if file contains prompt optimization code
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('enrichLeadWithAIOptimized') || content.includes('prompt-optimizer')) {
        console.log(`   ✅ ${file} contains prompt optimization integration`);
      } else {
        console.log(`   ⚠️  ${file} may not contain prompt optimization integration`);
        allFilesValid = false;
      }
    } else {
      console.log(`   ❌ ${file} - MISSING`);
      allFilesExist = false;
    }
  }

  console.log('\n🔍 Checking file content structure...');
  
  // Check prompt-optimizer.ts
  const optimizerPath = path.join(__dirname, '..', 'src/lib/prompt-optimizer.ts');
  if (fs.existsSync(optimizerPath)) {
    const content = fs.readFileSync(optimizerPath, 'utf8');
    const hasRequiredFunctions = [
      'registerPromptVariant',
      'getBestPromptVariant',
      'executePromptWithTracking',
      'createABTest',
      'evolvePrompt'
    ].every(func => content.includes(func));
    
    if (hasRequiredFunctions) {
      console.log('   ✅ prompt-optimizer.ts contains all required functions');
    } else {
      console.log('   ❌ prompt-optimizer.ts missing required functions');
      allFilesValid = false;
    }
  }

  // Check prompt-registry.ts
  const registryPath = path.join(__dirname, '..', 'src/lib/prompt-registry.ts');
  if (fs.existsSync(registryPath)) {
    const content = fs.readFileSync(registryPath, 'utf8');
    const hasRequiredExports = [
      'BASELINE_PROMPTS',
      'OPTIMIZED_VARIANTS',
      'initializePromptRegistry',
      'getActivePromptVariant'
    ].every(exportName => content.includes(exportName));
    
    if (hasRequiredExports) {
      console.log('   ✅ prompt-registry.ts contains all required exports');
    } else {
      console.log('   ❌ prompt-registry.ts missing required exports');
      allFilesValid = false;
    }
  }

  // Check API route
  const apiPath = path.join(__dirname, '..', 'src/app/api/prompt-optimization/route.ts');
  if (fs.existsSync(apiPath)) {
    const content = fs.readFileSync(apiPath, 'utf8');
    const hasRequiredHandlers = [
      'export async function POST',
      'export async function GET',
      'export async function PUT',
      'export async function OPTIONS'
    ].every(handler => content.includes(handler));
    
    if (hasRequiredHandlers) {
      console.log('   ✅ API route contains all required handlers');
    } else {
      console.log('   ❌ API route missing required handlers');
      allFilesValid = false;
    }
  }

  // Check migration file
  const migrationPath = path.join(__dirname, '..', 'supabase/migrations/20241221_create_prompt_optimization_system.sql');
  if (fs.existsSync(migrationPath)) {
    const content = fs.readFileSync(migrationPath, 'utf8');
    const hasRequiredTables = [
      'CREATE TABLE.*prompt_registry',
      'CREATE TABLE.*prompt_performance',
      'CREATE TABLE.*prompt_ab_tests',
      'CREATE TABLE.*prompt_evolution'
    ].every(table => new RegExp(table, 'i').test(content));
    
    if (hasRequiredTables) {
      console.log('   ✅ Migration file contains all required tables');
    } else {
      console.log('   ❌ Migration file missing required tables');
      allFilesValid = false;
    }
  }

  console.log('\n📊 Verification Results:');
  console.log(`   Files exist: ${allFilesExist ? '✅' : '❌'}`);
  console.log(`   Files valid: ${allFilesValid ? '✅' : '❌'}`);
  
  if (allFilesExist && allFilesValid) {
    console.log('\n🎉 Prompt System Files Verification PASSED!');
    console.log('✅ All required files created successfully');
    console.log('✅ All files have valid content structure');
    console.log('✅ Prompt optimization system ready for deployment');
    console.log('\n📋 Next Steps:');
    console.log('   1. Apply database migration to create tables');
    console.log('   2. Initialize prompt registry with baseline prompts');
    console.log('   3. Test prompt optimization functionality');
    console.log('   4. Deploy to production with full isolation');
    return true;
  } else {
    console.log('\n⚠️  Prompt System Files Verification FAILED!');
    console.log('❌ Some files are missing or have invalid content');
    return false;
  }
}

// Run the verification
if (require.main === module) {
  const success = verifyPromptSystemFiles();
  process.exit(success ? 0 : 1);
}

module.exports = { verifyPromptSystemFiles };
