/**
 * Translation API Endpoint
 * 
 * Provides access to the 3-layer translation service via REST API
 * Supports both single and batch translation requests
 */

import { NextRequest, NextResponse } from 'next/server';
import { translateText, translateBatch, getTranslationStats, clearExpiredCache } from '../../../lib/translation-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text, texts, targetLanguage = 'fr', options = {} } = body;

    // Validate request
    if (!text && !texts) {
      return NextResponse.json(
        { success: false, error: 'Missing text or texts parameter' },
        { status: 400 }
      );
    }

    // Single text translation
    if (text) {
      console.log(`🌐 [TranslateAPI] Single translation request: "${text.substring(0, 50)}..." → ${targetLanguage}`);
      
      const translated = await translateText(text, targetLanguage, options);
      
      return NextResponse.json({
        success: true,
        translated,
        original: text,
        targetLanguage,
        source: 'api'
      }, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
          'Content-Type': 'application/json'
        }
      });
    }

    // Batch translation
    if (texts && Array.isArray(texts)) {
      console.log(`📦 [TranslateAPI] Batch translation request: ${texts.length} texts → ${targetLanguage}`);
      
      const translated = await translateBatch(texts, targetLanguage, options);
      
      return NextResponse.json({
        success: true,
        translated,
        original: texts,
        targetLanguage,
        source: 'api',
        count: texts.length
      }, {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600', // Cache for 1 hour
          'Content-Type': 'application/json'
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request format' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ [TranslateAPI] Translation request failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        console.log('📊 [TranslateAPI] Stats request');
        const stats = await getTranslationStats();
        return NextResponse.json({
          success: true,
          stats
        });

      case 'clear-cache':
        console.log('🧹 [TranslateAPI] Clear cache request');
        const clearedCount = await clearExpiredCache();
        return NextResponse.json({
          success: true,
          clearedCount,
          message: `Cleared ${clearedCount} expired cache entries`
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Use: stats, clear-cache' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ [TranslateAPI] GET request failed:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
