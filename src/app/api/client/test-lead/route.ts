import { NextRequest, NextResponse } from 'next/server';

/**
 * Test Connection Endpoint
 * Sends a test lead through the lead API to verify integration
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, language = 'en' } = body;

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key required' },
        { status: 400 }
      );
    }

    const isFrench = language === 'fr';

    // Construct test lead data
    const testLeadData = {
      name: isFrench ? 'Lead de Test Avenir' : 'Avenir Test Lead',
      email: 'test@aveniraisolutions.ca',
      message: isFrench 
        ? 'Ceci est un lead de test automatique pour vérifier votre intégration de formulaire. Si vous voyez ceci dans votre tableau de bord, votre connexion fonctionne parfaitement ! 🎉'
        : 'This is an automated test lead to verify your form integration. If you see this in your dashboard, your connection is working perfectly! 🎉',
    };

    console.log('[TestLead] Sending test lead with API key:', apiKey.substring(0, 8) + '...');

    // Send test lead to lead API
    const leadApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://www.aveniraisolutions.ca';
    const response = await fetch(`${leadApiUrl}/api/lead`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(testLeadData),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      console.log('[TestLead] ✅ Test lead sent successfully');
      return NextResponse.json({
        success: true,
        message: isFrench 
          ? 'Lead de test envoyé avec succès ! Vérifiez votre tableau de bord.'
          : 'Test lead sent successfully! Check your dashboard.',
        leadId: result.leadId,
      });
    } else {
      console.error('[TestLead] ❌ Test lead failed:', result);
      return NextResponse.json({
        success: false,
        error: result.error || (isFrench ? 'Échec de l\'envoi du lead de test' : 'Failed to send test lead'),
      }, { status: response.status });
    }

  } catch (error) {
    console.error('[TestLead] ❌ Error sending test lead:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    }, { status: 500 });
  }
}

