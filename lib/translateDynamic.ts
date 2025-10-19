import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Detects if text is in French based on accented characters
 */
function isFrenchText(text: string): boolean {
  const frenchAccents = /[éèêëàùûüïîôç]/i;
  return frenchAccents.test(text);
}

/**
 * Translates dynamic text using OpenAI with Supabase caching
 * @param text - The text to translate
 * @param targetLocale - Target locale ("fr" or "en")
 * @returns Promise<string> - The translated text
 */
export async function translateDynamic(text: string, targetLocale: "fr" | "en"): Promise<string> {
  console.log(`[💡 Translation Applied] Starting translation for: "${text.substring(0, 50)}..." to ${targetLocale}`);
  
  // Check if text is already in target language
  const isTextFrench = isFrenchText(text);
  const isTargetFrench = targetLocale === 'fr';
  
  if (isTextFrench === isTargetFrench) {
    console.log(`[💡 Translation Applied] Text already in target language, returning as-is`);
    return text;
  }
  
  // Check for cached translation
  console.log(`[💡 Translation Applied] Checking for cached translation...`);
  const { data: cachedTranslation, error: cacheError } = await supabase
    .from('lead_memory_translations')
    .select('translated_text')
    .eq('original_text', text)
    .eq('locale', targetLocale)
    .single();
  
  if (cachedTranslation && !cacheError) {
    console.log(`[💡 Cached Translation] Found cached translation: "${cachedTranslation.translated_text}"`);
    return cachedTranslation.translated_text;
  }
  
  // Generate new translation using OpenAI
  console.log(`[💡 Translation Applied] No cache found, generating new translation with OpenAI...`);
  
  const sourceLanguage = isTextFrench ? 'French' : 'English';
  const targetLanguage = targetLocale === 'fr' ? 'French' : 'English';
  
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional translator. Translate the following ${sourceLanguage} text to ${targetLanguage} while preserving the original tone, meaning, and context. Return only the translated text without any additional commentary or formatting.`
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 500,
      temperature: 0.3,
    });
    
    const translatedText = completion.choices[0]?.message?.content?.trim() || text;
    console.log(`[💡 Translation Applied] OpenAI translation generated: "${translatedText}"`);
    
    // Cache the translation in Supabase
    console.log(`[💡 Translation Applied] Caching translation in Supabase...`);
    const { error: insertError } = await supabase
      .from('lead_memory_translations')
      .insert({
        original_text: text,
        translated_text: translatedText,
        locale: targetLocale,
        created_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error(`[💡 Translation Applied] Error caching translation:`, insertError);
    } else {
      console.log(`[💡 Translation Applied] Translation cached successfully`);
    }
    
    return translatedText;
    
  } catch (error) {
    console.error(`[💡 Translation Applied] OpenAI translation error:`, error);
    console.log(`[💡 Translation Applied] Falling back to original text`);
    return text;
  }
}
