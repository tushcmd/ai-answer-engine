import puppeteer from "puppeteer";
import cheerio from "cheerio";

export interface ScrapedContent {
  url: string;
  content: string;
  title?: string;
}

export async function scrapeWebsites(
  urls: string[]
): Promise<ScrapedContent[]> {
  const browser = await puppeteer.launch();
  const scrapedContents: ScrapedContent[] = [];

  try {
    for (const url of urls) {
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      );

      try {
        await page.goto(url, { waitUntil: "networkidle0", timeout: 30000 });

        // Extract page content
        const content = await page.evaluate(() => {
          // Remove scripts, styles, and other non-content elements
          const elementsToRemove = document.querySelectorAll(
            "script, style, nav, header, footer"
          );
          elementsToRemove.forEach(el => el.remove());

          // Extract main content
          const mainContent = document.body.innerText;
          return mainContent;
        });

        // Use Cheerio for additional parsing if needed
        const $ = cheerio.load(await page.content());
        const title = $("title").text();

        // Clean and process content
        const cleanedContent = content
          .replace(/\s+/g, " ")
          .trim()
          .substring(0, 4000); // Limit content length

        scrapedContents.push({
          url,
          content: cleanedContent,
          title,
        });
      } catch (pageError) {
        console.error(`Error scraping ${url}:`, pageError);
      } finally {
        await page.close();
      }
    }
  } catch (error) {
    console.error("Scraping error:", error);
  } finally {
    await browser.close();
  }

  return scrapedContents;
}

// Utility to validate URLs
export function validateUrls(urls: string[]): string[] {
  const urlRegex =
    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
  return urls.filter(url => urlRegex.test(url));
}
