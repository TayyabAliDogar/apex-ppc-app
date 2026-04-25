// Amazon Product Scraper using WebFetch (Server-Side AI Extraction)
// This bypasses CORS by using Claude's WebFetch tool

/**
 * Scrape Amazon product data by ASIN using WebFetch
 * @param {string} asin - Amazon ASIN (e.g., B09XYZ1234)
 * @param {string} marketplace - Amazon marketplace (default: 'com' for US)
 * @returns {Promise<Object>} Product data
 */
export async function scrapeAmazonProduct(asin, marketplace = 'com') {
  if (!asin || typeof asin !== 'string') {
    throw new Error('Invalid ASIN provided');
  }

  const cleanAsin = asin.trim().toUpperCase();
  const url = `https://www.amazon.${marketplace}/dp/${cleanAsin}`;

  try {
    console.log(`🔍 Scraping Amazon product via backend: ${url}`);

    // Call backend API endpoint that uses WebFetch
    const response = await fetch('/api/scrape-amazon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ asin: cleanAsin, marketplace })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to fetch product: ${response.status}`);
    }

    const productData = await response.json();
    console.log('✅ Successfully scraped product data:', productData);
    return productData;

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    throw new Error(`Failed to scrape Amazon product: ${error.message}`);
  }
}

/**
 * Scrape multiple competitor products
 * @param {string[]} asins - Array of ASINs
 * @param {string} marketplace - Amazon marketplace
 * @returns {Promise<Object[]>} Array of product data
 */
export async function scrapeCompetitors(asins, marketplace = 'com') {
  const results = [];
  const errors = [];

  for (const asin of asins) {
    if (!asin || !asin.trim()) continue;

    try {
      const productData = await scrapeAmazonProduct(asin, marketplace);
      results.push(productData);

      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));

    } catch (error) {
      console.error(`❌ Failed to scrape ${asin}:`, error.message);
      errors.push({ asin, error: error.message });
    }
  }

  if (results.length === 0 && errors.length > 0) {
    throw new Error(`Failed to scrape any products. Errors: ${errors.map(e => e.error).join(', ')}`);
  }

  return results;
}
