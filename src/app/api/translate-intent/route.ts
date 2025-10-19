import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { intent, locale } = await req.json();

    if (!intent || !locale) {
      return NextResponse.json(
        { success: false, error: 'Intent and locale are required' },
        { status: 400 }
      );
    }

    // Determine source and target languages
    const sourceLang = locale === 'fr' ? 'en' : 'fr';
    const targetLang = locale;

    console.log(`[IntentTranslation] Request: "${intent}" (${sourceLang} → ${targetLang})`);

    // Check if translation already exists in cache
    const { data: cachedTranslation, error: cacheError } = await supabase
      .from('intent_translations')
      .select('translated')
      .eq('original', intent)
      .eq('target_lang', targetLang)
      .limit(1)
      .single();

    if (cachedTranslation && !cacheError) {
      console.log(`[IntentTranslation] Cache hit: "${intent}" → "${cachedTranslation.translated}"`);
      return NextResponse.json({
        success: true,
        translated: cachedTranslation.translated,
        cached: true
      });
    }

    // Translate using OpenAI
    console.log(`[IntentTranslation] Cache miss, calling OpenAI for: "${intent}"`);
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional translator specializing in business and technical terminology. Translate the following business intent phrase from ${sourceLang} to ${targetLang}. Return only the translated phrase, nothing else.`
        },
        {
          role: "user",
          content: intent
        }
      ],
      max_tokens: 50,
      temperature: 0.1,
    });

    const translated = completion.choices[0]?.message?.content?.trim() || intent;

    console.log(`[IntentTranslation] OpenAI result: "${intent}" → "${translated}"`);

    // Cache the translation
    const { error: insertError } = await supabase
      .from('intent_translations')
      .insert({
        original: intent,
        translated: translated,
        source_lang: sourceLang,
        target_lang: targetLang
      });

    if (insertError) {
      console.error('[IntentTranslation] Failed to cache translation:', insertError);
    } else {
      console.log(`[IntentTranslation] Cached translation: "${intent}" → "${translated}"`);
    }

    return NextResponse.json({
      success: true,
      translated: translated,
      cached: false
    });

  } catch (error) {
    console.error('[IntentTranslation] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Translation failed' },
      { status: 500 }
    );
  }
}
