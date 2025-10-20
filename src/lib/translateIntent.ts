export async function translateIntent(rawTopIntent: string, locale: string): Promise<string> {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: rawTopIntent, 
        targetLanguage: locale,
        options: {
          context: 'dashboard_intent',
          priority: 9
        }
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        console.log(`[IntentTranslation] Dashboard: "${rawTopIntent}" → "${data.translated}"`);
        return data.translated;
      }
    }
  } catch (error) {
    console.error('[IntentTranslation] Dashboard translation failed:', error);
  }
  
  // Fallback to original intent
  return rawTopIntent;
}
