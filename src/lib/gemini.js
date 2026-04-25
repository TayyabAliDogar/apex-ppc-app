import { db } from './db';
import { apiKeyManager } from './api-key-manager';

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

const GEMINI_MODELS =[
  { name: 'gemini-2.5-flash', path: 'models/gemini-2.5-flash', priority: 1 },
  { name: 'gemini-2.5-flash-lite', path: 'models/gemini-2.5-flash-lite', priority: 2 },
];

let currentModelIndex = 0;

class RateLimiter {
  constructor() {
    this.minuteRequests =[];
    this.dailyCount = parseInt(localStorage.getItem('ai_daily_count') || '0');
    this.lastResetDate = localStorage.getItem('ai_last_reset') || new Date().toDateString();
  }

  async checkLimit() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailyCount = 0;
      this.lastResetDate = today;
      localStorage.setItem('ai_daily_count', '0');
      localStorage.setItem('ai_last_reset', today);
    }

    if (this.dailyCount >= 1500) {
      throw new GeminiError('Daily AI limit reached (1500 requests). Try again tomorrow.', 'RATE_LIMIT');
    }

    const now = Date.now();
    this.minuteRequests = this.minuteRequests.filter(t => now - t < 60000);

    if (this.minuteRequests.length >= 15) {
      const waitSeconds = Math.ceil((60000 - (now - this.minuteRequests[0])) / 1000);
      throw new GeminiError(`Rate limit: Please wait ${waitSeconds} seconds before trying again.`, 'RATE_LIMIT');
    }

    this.minuteRequests.push(now);
    this.dailyCount++;
    localStorage.setItem('ai_daily_count', this.dailyCount.toString());
  }

  getRemainingRequests() {
    return {
      daily: 1500 - this.dailyCount,
      perMinute: 15 - this.minuteRequests.filter(t => Date.now() - t < 60000).length
    };
  }
}

const rateLimiter = new RateLimiter();

export class GeminiError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'GeminiError';
    this.code = code;
  }
}

export async function optimizeListing(listing, competitorData = null) {
  if (!listing.title || !listing.bullets || !listing.description) {
    throw new GeminiError('Invalid listing data', 'VALIDATION_ERROR');
  }

  if (!navigator.onLine) {
    throw new GeminiError('AI features require internet connection.', 'OFFLINE');
  }

  // FIXED: Robust API Key Retrieval with Fallbacks
  let apiKey = null;
  try {
    apiKey = apiKeyManager.getActiveKey();
  } catch (e) { console.warn("apiKeyManager failed, falling back..."); }

  if (!apiKey) {
    apiKey = import.meta.env.VITE_GEMINI_API_KEY ||
             localStorage.getItem('vibe_api_key') ||
             localStorage.getItem('gemini_api_key');
  }

  if (!apiKey) {
    throw new GeminiError(
      'No API key found. Please go to Settings and add your Gemini API key from aistudio.google.com',
      'NO_API_KEY'
    );
  }

  await rateLimiter.checkLimit();

  const cacheKey = `listing_${hashListing(listing)}_${competitorData ? 'with_competitors' : 'no_competitors'}`;
  const cached = await getCachedResult(cacheKey);
  if (cached) return cached;

  const prompt = buildListingPrompt(listing, competitorData);

  try {
    const result = await callWithRetry(async () => {
      return await callGeminiAPI(apiKey, prompt);
    });

    await cacheResult(cacheKey, result);
    return result;

  } catch (error) {
    console.error('❌ Gemini API Error:', error);
    if (error instanceof GeminiError) throw error;
    if (error.message.includes('JSON')) throw new GeminiError('Failed to parse AI response. Try again.', 'PARSE_ERROR');
    throw new GeminiError(`API Error: ${error.message}`, 'UNKNOWN_ERROR');
  }
}

async function callWithRetry(apiCall, maxRetries = 3) {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      if (['AUTH_ERROR', 'RATE_LIMIT', 'SHARED_KEY_LIMIT', 'VALIDATION_ERROR', 'NO_API_KEY'].includes(error.code)) {
        throw error;
      }
      if (attempt === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  throw lastError;
}

async function callGeminiAPI(apiKey, prompt) {
  let lastError;
  currentModelIndex = 0; 

  for (let attempt = 0; attempt < GEMINI_MODELS.length; attempt++) {
    const model = GEMINI_MODELS[currentModelIndex];
    const url = `${GEMINI_API_BASE}/${model.path}:generateContent?key=${apiKey}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts:[{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (responseText) {
          // FIXED: Robust JSON parsing ignoring markdown blocks
          let cleaned = responseText;
          const match = responseText.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
          if (match) {
            cleaned = match[1];
          } else {
            const start = responseText.indexOf('{');
            const end = responseText.lastIndexOf('}');
            if (start !== -1 && end !== -1) {
              cleaned = responseText.substring(start, end + 1);
            }
          }
          return JSON.parse(cleaned.trim());
        }
      }

      if (response.status === 404 || response.status === 403 || response.status === 401 || response.status === 429) {
        const errors = {
          404: new GeminiError(`Model unavailable.`, 'MODEL_ERROR'),
          403: new GeminiError('Invalid API key.', 'AUTH_ERROR'),
          401: new GeminiError('Invalid API key.', 'AUTH_ERROR'),
          429: new GeminiError('Rate limit exceeded. Please wait.', 'RATE_LIMIT')
        };
        throw errors[response.status];
      }
      
      throw new GeminiError(`API Error (${response.status})`, 'API_ERROR');

    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') throw new GeminiError('Request timed out.', 'TIMEOUT');
      if (['AUTH_ERROR', 'RATE_LIMIT', 'NO_API_KEY'].includes(error.code)) throw error;
      
      lastError = error;
      if (currentModelIndex < GEMINI_MODELS.length - 1) {
        currentModelIndex++;
        continue;
      }
    }
  }
  throw lastError || new GeminiError('All AI models failed.', 'MODEL_ERROR');
}

function buildListingPrompt(listing, competitorData = null) {
  // Build competitor analysis section based on whether we have real data
  let competitorSection = '';

  if (competitorData && competitorData.length > 0) {
    // We have REAL competitor data from Amazon
    competitorSection = `
REAL COMPETITOR DATA (Fetched from Amazon):

${competitorData.map((comp, idx) => `
COMPETITOR ${idx + 1} (ASIN: ${comp.asin}):
Title: ${comp.title}
Bullet Points:
${comp.bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}
Description: ${comp.description}
Price: $${comp.price || 'N/A'}
Rating: ${comp.rating || 'N/A'} stars (${comp.reviewCount || 'N/A'} reviews)
`).join('\n')}

YOUR TASK WITH REAL COMPETITOR DATA:
1. Analyze the ACTUAL competitor listings above (not assumptions)
2. Identify keywords they use that this listing is missing
3. Find weaknesses in their listings (poor descriptions, missing features, weak bullet points)
4. Create a differentiation strategy based on REAL gaps you see
5. Generate COMPLETE, FULL-LENGTH content that outperforms these specific competitors
`;
  } else {
    // No competitor data - make it clear we're using generic patterns
    competitorSection = `
⚠️ NO COMPETITOR DATA PROVIDED - Using generic optimization patterns.

For authentic competitor analysis, use the ASIN-based competitor analysis feature to fetch real competitor listings.

YOUR TASK WITHOUT COMPETITOR DATA:
1. Optimize based on general Amazon best practices
2. Use common high-volume keywords for the product category
3. Generate COMPLETE, FULL-LENGTH content following Amazon guidelines
4. Note: Competitor insights will be generic without real competitor data
`;
  }

  return `You are an expert Amazon listing optimization specialist with 10+ years of experience. Your task is to create COMPLETE, AMAZON-READY content that can be copy-pasted directly to Amazon Seller Central.

CURRENT LISTING:
Title: ${listing.title}
Bullet Points:
${listing.bullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}
Description: ${listing.description}

${competitorSection}

CRITICAL REQUIREMENTS:
- Title: 150-200 characters (FULL optimized title with primary keywords, brand, key features, size/quantity)
- Each Bullet Point: 400-500 characters (FULL detailed descriptions, not summaries. Include benefits, features, use cases, and keywords)
- Description: 1500-2000 characters (FULL product story with paragraphs, benefits, features, specifications, and call-to-action)
- ALL content must be Amazon-compliant (no promotional language like "best", "cheapest", no external links)
- Include high-volume keywords naturally throughout
- Differentiate from competitors by highlighting unique features

OUTPUT FORMAT (JSON only, no markdown):
{
  "seoScore": 85,
  "competitorInsights": {
    "topKeywords": ["keyword1", "keyword2", "keyword3"],
    "competitorWeaknesses": ["weakness1", "weakness2"],
    "differentiationStrategy": "One sentence on how to stand out",
    "dataSource": "${competitorData ? 'REAL_AMAZON_DATA' : 'GENERIC_PATTERNS'}"
  },
  "suggestions": [
    {"field": "title", "issue": "Missing primary keyword", "fix": "Add 'premium stainless steel' at the beginning"},
    {"field": "bullet1", "issue": "Too short, only 50 characters", "fix": "Expand to 450+ characters with benefits and use cases"}
  ],
  "optimized": {
    "title": "FULL 150-200 character optimized title here with brand, keywords, features, size",
    "bullets": [
      "FULL 400-500 character bullet point 1 with detailed benefits, features, use cases, and keywords naturally integrated",
      "FULL 400-500 character bullet point 2 with detailed benefits, features, use cases, and keywords naturally integrated",
      "FULL 400-500 character bullet point 3 with detailed benefits, features, use cases, and keywords naturally integrated",
      "FULL 400-500 character bullet point 4 with detailed benefits, features, use cases, and keywords naturally integrated",
      "FULL 400-500 character bullet point 5 with detailed benefits, features, use cases, and keywords naturally integrated"
    ],
    "description": "FULL 1500-2000 character product description with multiple paragraphs, product story, benefits, features, specifications, use cases, and call-to-action. Include keywords naturally. Make it compelling and Amazon-compliant."
  }
}

IMPORTANT: Generate COMPLETE content, not summaries. Each bullet should be 400-500 characters. Description should be 1500-2000 characters. This must be ready to copy-paste to Amazon with NO editing required.`;
}

async function getCachedResult(cacheKey) {
  try {
    const cached = await db.aiCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) return cached.response;
  } catch (e) {}
  return null;
}

async function cacheResult(cacheKey, response) {
  try { await db.aiCache.put({ hash: cacheKey, response, timestamp: Date.now() }); } catch (e) {}
}

function hashListing(listing) { return JSON.stringify(listing).length.toString(); }

export function getAIQuota() { return rateLimiter.getRemainingRequests(); }