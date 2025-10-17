#!/bin/bash

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║  🚀 AVENIR AI — FULL E2E TEST SUITE LAUNCHER                 ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if server is running
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1: Checking server status..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if curl -s http://localhost:3000 > /dev/null; then
  echo "✅ Server is running on http://localhost:3000"
else
  echo "❌ Server is not running!"
  echo ""
  echo "Please start the development server first:"
  echo "  npm run dev"
  echo ""
  echo "Or start production server:"
  echo "  npm run build"
  echo "  npm start"
  echo ""
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 2: Running E2E test suite..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Run the Node.js test suite
node tests/run-e2e-tests.js

TEST_EXIT_CODE=$?

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 3: Generating reports..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -f "tests/AVENIR_AI_SYSTEM_E2E_REPORT.md" ]; then
  echo "✅ Test report generated:"
  echo "   📄 tests/AVENIR_AI_SYSTEM_E2E_REPORT.md"
else
  echo "⚠️  Report file not found"
fi

if [ -f "tests/AVENIR_AI_SYSTEM_BLUEPRINT.md" ]; then
  echo "✅ System blueprint available:"
  echo "   📄 tests/AVENIR_AI_SYSTEM_BLUEPRINT.md"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Available Documentation:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  1. System Blueprint:    tests/AVENIR_AI_SYSTEM_BLUEPRINT.md"
echo "  2. E2E Test Report:     tests/AVENIR_AI_SYSTEM_E2E_REPORT.md"
echo "  3. Links Reference:     docs/LINKS_REFERENCE.md"
echo "  4. Links Reference PDF: docs/LINKS_REFERENCE.pdf"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "✅ ALL TESTS PASSED — System Ready for Production"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 0
else
  echo "⚠️  SOME TESTS FAILED — Review report for details"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi

