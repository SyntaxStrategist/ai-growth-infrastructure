#!/bin/bash

# Generate all four Avenir AI Solutions PDFs (fresh start - V1)
# A4 Landscape with 2cm margins and consistent design

echo "🎨 Generating Avenir AI Solutions PDFs (Fresh Start - V1)"
echo "📄 Format: A4 Landscape (297mm x 210mm)"
echo "📐 Margins: 2cm on all sides"
echo "✨ Clean, modern design with perfect spacing"
echo ""

CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ ! -f "$CHROME_PATH" ]; then
    echo "❌ Error: Google Chrome not found at $CHROME_PATH"
    exit 1
fi

ABS_PATH="$(pwd)"

# Array of files to generate
declare -a INPUTS=(
    "AVENIR_AI_ARCHITECTURE_FINAL_V1_EN.html"
    "AVENIR_AI_ARCHITECTURE_FINAL_V1_FR.html"
    "AVENIR_AI_CLIENT_FLOW_FINAL_V1_EN.html"
    "AVENIR_AI_CLIENT_FLOW_FINAL_V1_FR.html"
)

declare -a OUTPUTS=(
    "AVENIR_AI_ARCHITECTURE_FINAL_V1_EN.pdf"
    "AVENIR_AI_ARCHITECTURE_FINAL_V1_FR.pdf"
    "AVENIR_AI_CLIENT_FLOW_FINAL_V1_EN.pdf"
    "AVENIR_AI_CLIENT_FLOW_FINAL_V1_FR.pdf"
)

declare -a NAMES=(
    "Technical Architecture (EN)"
    "Architecture Technique (FR)"
    "Client Flow (EN)"
    "Flux Client (FR)"
)

SUCCESS_COUNT=0
TOTAL_COUNT=${#INPUTS[@]}

for i in "${!INPUTS[@]}"; do
    INPUT="${INPUTS[$i]}"
    OUTPUT="${OUTPUTS[$i]}"
    NAME="${NAMES[$i]}"
    
    echo "============================================"
    echo "📄 Generating: $NAME"
    echo "============================================"
    echo "   Input:  $INPUT"
    echo "   Output: $OUTPUT"
    echo ""
    
    if [ ! -f "$INPUT" ]; then
        echo "❌ Error: $INPUT not found"
        continue
    fi
    
    # Generate PDF with clean settings
    "$CHROME_PATH" \
        --headless \
        --disable-gpu \
        --print-to-pdf="$OUTPUT" \
        --print-to-pdf-no-header \
        --no-pdf-header-footer \
        --run-all-compositor-stages-before-draw \
        --virtual-time-budget=10000 \
        "file://$ABS_PATH/$INPUT" 2>/dev/null
    
    if [ -f "$OUTPUT" ]; then
        SIZE=$(du -h "$OUTPUT" | awk '{print $1}')
        PAGES=$(file "$OUTPUT" | grep -oE '[0-9]+ pages?' | grep -oE '[0-9]+' || echo "1")
        echo "✅ Generated: $OUTPUT"
        echo "   Size: $SIZE"
        echo "   Pages: $PAGES"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo "❌ Failed to generate: $OUTPUT"
    fi
    echo ""
done

echo "============================================"
echo "🎉 PDF Generation Complete!"
echo "============================================"
echo "Success: $SUCCESS_COUNT / $TOTAL_COUNT"
echo ""

if [ $SUCCESS_COUNT -eq $TOTAL_COUNT ]; then
    echo "📄 All PDFs Generated Successfully:"
    echo ""
    for OUTPUT in "${OUTPUTS[@]}"; do
        if [ -f "$OUTPUT" ]; then
            SIZE=$(du -h "$OUTPUT" | awk '{print $1}')
            PAGES=$(file "$OUTPUT" | grep -oE '[0-9]+ pages?' | grep -oE '[0-9]+' || echo "1")
            echo "   ✅ $OUTPUT ($SIZE, $PAGES page(s))"
        fi
    done
    echo ""
    echo "============================================"
    echo "📍 Location: $ABS_PATH"
    echo "============================================"
    echo ""
    echo "🎯 View All PDFs:"
    echo "   open AVENIR_AI_*_FINAL_*.pdf"
    echo ""
    echo "✨ All PDFs feature clean design with 2cm margins!"
    echo ""
else
    echo "⚠️  Some PDFs failed to generate. Check errors above."
    exit 1
fi

