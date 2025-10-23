#!/usr/bin/env python3
"""
Simple HTML to PDF converter using weasyprint
"""

try:
    from weasyprint import HTML, CSS
    import os
    
    def convert_html_to_pdf(html_file, pdf_file):
        """Convert HTML file to PDF"""
        try:
            html = HTML(filename=html_file)
            html.write_pdf(pdf_file)
            print(f"✅ Successfully converted {html_file} to {pdf_file}")
            return True
        except Exception as e:
            print(f"❌ Error converting {html_file}: {e}")
            return False
    
    # Convert English script
    en_success = convert_html_to_pdf(
        "AVENIR_VIDEO_SCRIPT_CLEAN_EN.html",
        "AVENIR_VIDEO_SCRIPT_CLEAN_EN.pdf"
    )
    
    # Convert French script
    fr_success = convert_html_to_pdf(
        "AVENIR_VIDEO_SCRIPT_CLEAN_FR.html", 
        "AVENIR_VIDEO_SCRIPT_CLEAN_FR.pdf"
    )
    
    if en_success and fr_success:
        print("🎉 Both PDFs created successfully!")
    else:
        print("⚠️ Some conversions failed")
        
except ImportError:
    print("❌ weasyprint not installed. Trying alternative method...")
    
    # Alternative: Create a simple HTML file that can be printed to PDF
    print("📄 Creating print-friendly HTML files...")
    
    # For now, just copy the files with .pdf extension for manual conversion
    import shutil
    
    try:
        shutil.copy("AVENIR_VIDEO_SCRIPT_CLEAN_EN.html", "AVENIR_VIDEO_SCRIPT_CLEAN_EN.pdf")
        shutil.copy("AVENIR_VIDEO_SCRIPT_CLEAN_FR.html", "AVENIR_VIDEO_SCRIPT_CLEAN_FR.pdf")
        print("📋 Files copied - you can manually print to PDF from browser")
    except Exception as e:
        print(f"❌ Error: {e}")
