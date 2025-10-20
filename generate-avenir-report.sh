#!/bin/bash

# Generate Avenir AI Company Analysis Report PDF
echo "🎯 Avenir AI — Company Analysis Report Generator"
echo "================================================"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js and try again."
    exit 1
fi

# Check if puppeteer is installed
if ! npm list puppeteer &> /dev/null; then
    echo "📦 Installing Puppeteer for PDF generation..."
    npm install puppeteer
fi

# Generate the PDF
echo "🚀 Generating PDF report..."
node generate-avenir-report-pdf.js

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Report generated successfully!"
    echo "📄 Open the PDF:"
    echo "   open Avenir_AI_Company_System_Value_Report.pdf"
    echo ""
    echo "📊 Report includes:"
    echo "   • Complete system analysis"
    echo "   • Business value proposition"
    echo "   • Technical architecture overview"
    echo "   • Revenue projections"
    echo "   • Market positioning"
    echo ""
    echo "🎨 Professional formatting with:"
    echo "   • Modern design and typography"
    echo "   • Color-coded sections"
    echo "   • Data visualizations"
    echo "   • Print-ready layout"
else
    echo "❌ Failed to generate PDF report"
    exit 1
fi
