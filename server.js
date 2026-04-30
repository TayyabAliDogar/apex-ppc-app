// Backend Server for Amazon Product Scraping
// This bypasses CORS by fetching from the server-side

import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// FIX: Add request cache to avoid repeated scraping
const scraperCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// FIX: Rotate User-Agents to avoid detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// FIX: Add delay utility for retry logic
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from dist folder (production build)
app.use(express.static(path.join(__dirname, 'dist')));

/**
 * Extract product data from Amazon HTML using regex
 */
function parseAmazonHTML(html, asin) {
  const productData = {
    asin: asin,
    title: '',
    bullets: [],
    description: '',
    price: 0,
    rating: 0,
    reviewCount: 0
  };

  try {
    // Extract title
    const titleMatch = html.match(/<span id="productTitle"[^>]*>\s*(.*?)\s*<\/span>/s);
    if (titleMatch) {
      productData.title = cleanText(titleMatch[1]);
    }

    // Extract bullet points
    const bulletMatches = html.matchAll(/<span class="a-list-item">\s*(.*?)\s*<\/span>/gs);
    for (const match of bulletMatches) {
      const bullet = cleanText(match[1]);
      if (bullet && bullet.length > 10 && !bullet.includes('See more product details')) {
        productData.bullets.push(bullet);
      }
    }

    // Extract description - try multiple patterns
    let description = '';

    // Pattern 1: Standard productDescription div with p tag
    const descMatch1 = html.match(/<div id="productDescription"[^>]*>\s*<p>(.*?)<\/p>/s);
    if (descMatch1) {
      description = cleanText(descMatch1[1]);
    }

    // Pattern 2: productDescription div with any content
    if (!description) {
      const descMatch2 = html.match(/<div id="productDescription"[^>]*>(.*?)<\/div>/s);
      if (descMatch2) {
        description = cleanText(descMatch2[1]);
      }
    }

    // Pattern 3: Feature bullets section (fallback)
    if (!description) {
      const descMatch3 = html.match(/<div id="feature-bullets"[^>]*>(.*?)<\/div>/s);
      if (descMatch3) {
        description = cleanText(descMatch3[1]);
      }
    }

    // Pattern 4: A+ content section
    if (!description) {
      const descMatch4 = html.match(/<div id="aplus"[^>]*>(.*?)<\/div>/s);
      if (descMatch4) {
        description = cleanText(descMatch4[1]);
      }
    }

    // Pattern 5: Any div with "description" in class or id
    if (!description) {
      const descMatch5 = html.match(/<div[^>]*(?:id|class)="[^"]*description[^"]*"[^>]*>(.*?)<\/div>/si);
      if (descMatch5) {
        description = cleanText(descMatch5[1]);
      }
    }

    if (description) {
      productData.description = description.substring(0, 2000);
    }

    // Extract price
    const priceMatch = html.match(/<span class="a-price-whole">(.*?)<\/span>/) ||
                      html.match(/<span class="a-offscreen">\$([\d,]+\.?\d*)<\/span>/);
    if (priceMatch) {
      const priceStr = priceMatch[1].replace(/[^0-9.]/g, '');
      productData.price = parseFloat(priceStr) || 0;
    }

    // Extract rating
    const ratingMatch = html.match(/<span class="a-icon-alt">([\d.]+) out of 5 stars<\/span>/);
    if (ratingMatch) {
      productData.rating = parseFloat(ratingMatch[1]) || 0;
    }

    // Extract review count
    const reviewMatch = html.match(/<span id="acrCustomerReviewText"[^>]*>([\d,]+)\s+ratings?<\/span>/);
    if (reviewMatch) {
      const reviewStr = reviewMatch[1].replace(/,/g, '');
      productData.reviewCount = parseInt(reviewStr) || 0;
    }

  } catch (parseError) {
    console.error('❌ HTML parsing error:', parseError);
  }

  return productData;
}

/**
 * Clean extracted text
 */
function cleanText(text) {
  if (!text) return '';

  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * API endpoint to scrape Amazon product
 */
app.post('/api/scrape-amazon', async (req, res) => {
  const { asin, marketplace = 'com' } = req.body;

  if (!asin) {
    return res.status(400).json({ error: 'ASIN is required' });
  }

  // FIX: Check cache first
  const cacheKey = `${asin}_${marketplace}`;
  const cached = scraperCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    console.log(`✅ Returning cached data for ${asin}`);
    return res.json(cached.data);
  }

  const url = `https://www.amazon.${marketplace}/dp/${asin}`;

  // FIX: Retry logic with exponential backoff
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔍 Fetching: ${url} (Attempt ${attempt}/${maxRetries})`);

      // FIX: Add random delay between retries to avoid rate limiting
      if (attempt > 1) {
        const delayMs = Math.pow(2, attempt - 1) * 1000 + Math.random() * 1000; // Exponential backoff with jitter
        console.log(`⏳ Waiting ${Math.round(delayMs)}ms before retry...`);
        await delay(delayMs);
      }

      const response = await fetch(url, {
        headers: {
          'User-Agent': getRandomUserAgent(), // FIX: Rotate user agents
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0',
          'DNT': '1'
        }
      });

      if (!response.ok) {
        throw new Error(`Amazon returned ${response.status}`);
      }

      const html = await response.text();

      // Check for CAPTCHA
      if (html.includes('Robot Check') || html.includes('captcha') || html.includes('Type the characters you see in this image')) {
        console.warn(`⚠️ CAPTCHA detected on attempt ${attempt}`);

        // If this is the last attempt, return error
        if (attempt === maxRetries) {
          return res.status(403).json({
            error: 'Amazon blocked the request with CAPTCHA. Please try again in a few minutes or use manual input.'
          });
        }

        // Otherwise, retry
        lastError = new Error('CAPTCHA detected');
        continue;
      }

      const productData = parseAmazonHTML(html, asin);

      if (!productData.title) {
        console.warn(`⚠️ No title found on attempt ${attempt}`);

        // If this is the last attempt, return error
        if (attempt === maxRetries) {
          return res.status(404).json({
            error: 'Could not extract product data. Product may not exist or page structure changed.'
          });
        }

        // Otherwise, retry
        lastError = new Error('No product data found');
        continue;
      }

      // FIX: Cache successful result
      scraperCache.set(cacheKey, {
        data: productData,
        timestamp: Date.now()
      });

      console.log(`✅ Successfully scraped: ${productData.title}`);
      return res.json(productData);

    } catch (error) {
      console.error(`❌ Scraping error on attempt ${attempt}:`, error.message);
      lastError = error;

      // If this is the last attempt, return error
      if (attempt === maxRetries) {
        return res.status(500).json({
          error: `Failed to scrape product after ${maxRetries} attempts: ${error.message}`
        });
      }
    }
  }

  // Fallback error response
  res.status(500).json({
    error: `Failed to scrape product: ${lastError?.message || 'Unknown error'}`
  });
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Amazon scraper backend is running' });
});

// Serve frontend for all other routes (SPA fallback)
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Amazon scraper backend running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/scrape-amazon`);
  console.log(`🌐 Frontend available at http://localhost:${PORT}`);
});
