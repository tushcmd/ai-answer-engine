import { NextResponse } from 'next/server';
import { scrapeWebsites, validateUrls } from '@/utils/scraper';
import { generateResponseWithSources } from '@/utils/groqClient';
import { checkRateLimit, CacheManager } from '@/utils/rateLimit';

export async function POST(req: Request) {
  try {
    // Extract IP from request
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    // Check rate limit
    const rateLimitResult = await checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimitResult.resetTime
        },
        { status: 429 }
      );
    }

    // Parse request body
    const { message, urls } = await req.json();

    // Validate input
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cachedResponse = await CacheManager.getCachedResponse({ message, urls });
    if (cachedResponse) {
      return NextResponse.json(cachedResponse);
    }

    // Process URLs if provided
    const validUrls = urls ? validateUrls(urls) : [];

    // Scrape websites if URLs are provided
    const scrapedContents = validUrls.length > 0
      ? await scrapeWebsites(validUrls)
      : [];

    // Generate response with sources
    const response = await generateResponseWithSources(
      message,
      scrapedContents
    );

    // Cache the response
    await CacheManager.cacheResponse(
      { message, urls },
      response,
      3600 // 1 hour cache
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs'; // Ensure Node.js runtime