// TODO: Implement the chat API with Groq and web scraping with Cheerio and Puppeteer
// Refer to the Next.js Docs on how to read the Request body: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
// Refer to the Groq SDK here on how to use an LLM: https://www.npmjs.com/package/groq-sdk
// Refer to the Cheerio docs here on how to parse HTML: https://cheerio.js.org/docs/basics/loading
// Refer to Puppeteer docs here: https://pptr.dev/guides/what-is-puppeteer

// export async function POST(req: Request) {
//   try {

//   } catch (error) {

//   }
// }
import { NextResponse } from "next/server";
import { scrapeWebsites, validateUrls } from "@/utils/scraper";
import { generateResponseWithSources } from "@/utils/groqClient";
import { checkRateLimit } from "@/utils/rateLimit";

export async function POST(req: Request) {
  try {
    // Extract IP from request
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

    // Check rate limit
    const rateLimitResult = await checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          retryAfter: rateLimitResult.resetTime,
        },
        { status: 429 }
      );
    }

    // Parse request body
    const { message, urls } = await req.json();

    // Validate input
    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Process URLs if provided
    const validUrls = urls ? validateUrls(urls) : [];

    // Scrape websites if URLs are provided
    const scrapedContents =
      validUrls.length > 0 ? await scrapeWebsites(validUrls) : [];

    // Generate response with sources
    const response = await generateResponseWithSources(
      message,
      scrapedContents
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs"; // Ensure Node.js runtime
