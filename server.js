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

    // Extract description
    const descMatch = html.match(/<div id="productDescription"[^>]*>\s*<p>(.*?)<\/p>/s);
    if (descMatch) {
      productData.description = cleanText(descMatch[1]).substring(0, 2000);
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

  const url = `https://www.amazon.${marketplace}/dp/${asin}`;

  try {
    console.log(`🔍 Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
      }
    });

    if (!response.ok) {
      throw new Error(`Amazon returned ${response.status}`);
    }

    const html = await response.text();

    // Check for CAPTCHA
    if (html.includes('Robot Check') || html.includes('captcha')) {
      return res.status(403).json({
        error: 'Amazon blocked the request with CAPTCHA. Try again later.'
      });
    }

    const productData = parseAmazonHTML(html, asin);

    if (!productData.title) {
      return res.status(404).json({
        error: 'Could not extract product data. Product may not exist or page structure changed.'
      });
    }

    console.log(`✅ Successfully scraped: ${productData.title}`);
    res.json(productData);

  } catch (error) {
    console.error('❌ Scraping error:', error);
    res.status(500).json({
      error: `Failed to scrape product: ${error.message}`
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Amazon scraper backend is running' });
});

// Serve frontend for all other routes (SPA fallback)
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Amazon scraper backend running on http://localhost:${PORT}`);
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/scrape-amazon`);
  console.log(`🌐 Frontend available at http://localhost:${PORT}`);
});
