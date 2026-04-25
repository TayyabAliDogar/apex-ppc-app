# VibePPC Command Center
## Technical Specifications - Part 2: AI Engine & Design System

**Version:** 1.0  
**Last Updated:** April 15, 2026  
**Companion Documents:** PROJECT_CONSTITUTION.md, TECH_SPECS_PART1.md, TECH_SPECS_PART3.md

---

## AI Engine Architecture

### Gemini 1.5 Flash Integration

**Model Selection Rationale:**
- **Context Window:** 1M tokens (can analyze entire bulk reports)
- **Speed:** 2-3 seconds for complex queries
- **Cost:** $0.075 per 1M input tokens (75% cheaper with caching)
- **Structured Output:** JSON schema enforcement for reliable parsing
- **Multimodal:** Future support for image analysis (product photos)

### AI Use Cases & Prompt Engineering

#### Use Case 1: Bleeding Keyword Detection

**Goal:** Identify keywords with high spend but low/no conversions

**Prompt Template:**

```javascript
const BLEEDING_KEYWORD_PROMPT = `You are an Amazon PPC optimization expert analyzing campaign performance data.

TASK: Identify "bleeding keywords" - search terms that are wasting budget with high spend but poor conversion rates.

DATA:
${JSON.stringify(keywords, null, 2)}

ANALYSIS CRITERIA:
- High spend: >$100 in the period
- Poor performance: ACoS >50% OR zero conversions
- Rank by urgency: (spend × days_active) / conversions

OUTPUT FORMAT (JSON):
{
  "bleedingKeywords": [
    {
      "keyword": "string",
      "currentBid": number,
      "totalSpend": number,
      "conversions": number,
      "acos": number,
      "urgencyScore": number (0-100),
      "recommendation": "pause" | "reduce_bid" | "add_negative",
      "suggestedBid": number | null,
      "reasoning": "string (explain why this keyword is bleeding)",
      "confidence": number (0-100)
    }
  ],
  "summary": {
    "totalBleedingKeywords": number,
    "totalWastedSpend": number,
    "potentialSavings": number
  }
}

IMPORTANT:
- Only include keywords that meet the bleeding criteria
- Provide clear, actionable reasoning
- Calculate confidence based on data quality and sample size
- If conversions = 0 and spend > $200, urgency = 100`;
```

**Implementation:**

```javascript
// /src/lib/ai/bleeding-keywords.js
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function analyzeBleedingKeywords(keywords) {
  // Filter to relevant keywords (reduce token usage)
  const relevantKeywords = keywords
    .filter(k => k.spend > 50)
    .map(k => ({
      keyword: k.text,
      bid: k.bid,
      spend: k.spend,
      conversions: k.conversions,
      acos: k.acos,
      daysActive: k.daysActive
    }));

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          bleedingKeywords: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                keyword: { type: 'string' },
                currentBid: { type: 'number' },
                totalSpend: { type: 'number' },
                conversions: { type: 'number' },
                acos: { type: 'number' },
                urgencyScore: { type: 'number' },
                recommendation: { type: 'string' },
                suggestedBid: { type: 'number' },
                reasoning: { type: 'string' },
                confidence: { type: 'number' }
              }
            }
          },
          summary: {
            type: 'object',
            properties: {
              totalBleedingKeywords: { type: 'number' },
              totalWastedSpend: { type: 'number' },
              potentialSavings: { type: 'number' }
            }
          }
        }
      }
    }
  });

  const prompt = BLEEDING_KEYWORD_PROMPT.replace(
    '${JSON.stringify(keywords, null, 2)}',
    JSON.stringify(relevantKeywords, null, 2)
  );

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}
```

#### Use Case 2: Bid Optimization

**Goal:** Recommend optimal bid adjustments based on performance history

**Prompt Template:**

```javascript
const BID_OPTIMIZATION_PROMPT = `You are an Amazon PPC bid optimization specialist.

TASK: Recommend optimal bid adjustment for this keyword based on historical performance.

KEYWORD DATA:
${JSON.stringify(keywordHistory, null, 2)}

TARGET METRICS:
- Target ACoS: ${targetACoS}%
- Current ACoS: ${currentACoS}%
- Budget remaining: $${budgetRemaining}

HISTORICAL CONTEXT (30 days):
- Average daily spend: $${avgDailySpend}
- Conversion rate: ${conversionRate}%
- Click-through rate: ${ctr}%
- Trend: ${trend} (improving/declining/stable)

OUTPUT FORMAT (JSON):
{
  "currentBid": number,
  "recommendedBid": number,
  "bidChange": number (percentage),
  "expectedImpact": {
    "acos": number (predicted new ACoS),
    "dailySpend": number,
    "conversions": number (predicted daily)
  },
  "reasoning": "string (explain the math and logic)",
  "confidence": number (0-100),
  "riskLevel": "low" | "medium" | "high",
  "alternatives": [
    {
      "bid": number,
      "scenario": "string (conservative/aggressive)",
      "expectedACoS": number
    }
  ]
}

OPTIMIZATION RULES:
1. If current ACoS < target ACoS: Consider increasing bid (capture more volume)
2. If current ACoS > target ACoS: Reduce bid (improve efficiency)
3. If conversions = 0 but CTR is high: Listing issue, not bid issue
4. Never recommend bid changes >50% in one adjustment
5. Factor in seasonality and trend direction
6. Higher confidence = more data points available`;
```

**Implementation:**

```javascript
// /src/lib/ai/bid-optimizer.js
export async function optimizeBid(keywordId, targetACoS) {
  // Fetch 30-day history
  const history = await db.keywords
    .where('id').equals(keywordId)
    .first();

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: bidOptimizationSchema
    }
  });

  const prompt = buildBidOptimizationPrompt(history, targetACoS);
  const result = await model.generateContent(prompt);
  
  return JSON.parse(result.response.text());
}
```

#### Use Case 3: Listing Content Analysis

**Goal:** Analyze product listing for SEO effectiveness and suggest improvements

**Prompt Template:**

```javascript
const LISTING_ANALYSIS_PROMPT = `You are an Amazon SEO and copywriting expert.

TASK: Analyze this product listing and provide actionable optimization recommendations.

LISTING DATA:
Title: ${title}
Bullet Points:
${bulletPoints.map((b, i) => `${i + 1}. ${b}`).join('\n')}
Description: ${description}

COMPETITOR LISTINGS (Top 3):
${competitors.map(c => `- ${c.title} (BSR: ${c.bsr})`).join('\n')}

KEYWORD DATA:
Target Keywords: ${targetKeywords.join(', ')}
Current Ranking: ${currentRankings}

OUTPUT FORMAT (JSON):
{
  "seoScore": number (0-100),
  "breakdown": {
    "titleOptimization": number (0-100),
    "bulletPointQuality": number (0-100),
    "keywordDensity": number (0-100),
    "readability": number (0-100)
  },
  "keywordGaps": [
    {
      "keyword": "string",
      "searchVolume": "high" | "medium" | "low",
      "competitorUsage": number (how many competitors use it),
      "recommendation": "string"
    }
  ],
  "improvements": [
    {
      "section": "title" | "bullet1" | "bullet2" | "bullet3" | "bullet4" | "bullet5" | "description",
      "issue": "string",
      "suggestion": "string (rewritten version)",
      "impact": "high" | "medium" | "low",
      "reasoning": "string"
    }
  ],
  "competitiveAdvantages": ["string"],
  "competitiveWeaknesses": ["string"]
}

ANALYSIS CRITERIA:
- Title: Front-load important keywords, stay under 200 chars
- Bullets: Feature + Benefit format, scannable, keyword-rich
- Avoid keyword stuffing (density <3% per keyword)
- Use emotional triggers and power words
- Compare to top competitors' strategies`;
```

#### Use Case 4: Predictive Forecasting

**Goal:** Forecast future sales and ad spend based on historical trends

**Prompt Template:**

```javascript
const FORECASTING_PROMPT = `You are a data scientist specializing in time-series forecasting for e-commerce.

TASK: Forecast the next 7 days of sales and ad spend based on historical data.

HISTORICAL DATA (30 days):
${JSON.stringify(historicalData, null, 2)}

CONTEXT:
- Current season: ${season}
- Upcoming events: ${upcomingEvents}
- Recent trend: ${trend}
- Day of week patterns: ${dayOfWeekPatterns}

OUTPUT FORMAT (JSON):
{
  "forecasts": [
    {
      "date": "YYYY-MM-DD",
      "predictedSales": number,
      "predictedSpend": number,
      "predictedROAS": number,
      "confidenceInterval": {
        "lower": number,
        "upper": number
      },
      "confidence": number (0-100)
    }
  ],
  "insights": [
    {
      "type": "opportunity" | "risk" | "trend",
      "message": "string",
      "impact": "high" | "medium" | "low",
      "actionable": boolean
    }
  ],
  "recommendations": [
    {
      "action": "string",
      "timing": "string (when to act)",
      "expectedImpact": "string"
    }
  ]
}

FORECASTING RULES:
1. Account for day-of-week seasonality
2. Identify and extrapolate trends (linear, exponential, cyclical)
3. Flag anomalies in historical data
4. Wider confidence intervals = less certainty
5. Highlight potential risks (budget depletion, declining ROAS)`;
```

### AI Response Caching Strategy

**Cache Key Generation:**

```javascript
// /src/lib/ai/cache.js
import crypto from 'crypto';

export function generateCacheKey(prompt, data) {
  const hash = crypto
    .createHash('sha256')
    .update(JSON.stringify({ prompt, data }))
    .digest('hex');
  
  return `ai:${hash}`;
}

export async function getCachedResponse(cacheKey) {
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  return null;
}

export async function setCachedResponse(cacheKey, response, ttl = 3600) {
  await redis.setex(cacheKey, ttl, JSON.stringify(response));
}
```

**Cache TTL Strategy:**
- Bleeding keywords: 1 hour (data changes frequently)
- Bid optimization: 1 hour (market conditions change)
- Listing analysis: 24 hours (content changes rarely)
- Forecasts: 6 hours (predictions decay over time)

### Token Optimization Techniques

**1. Data Aggregation (Reduce Input Tokens)**

```javascript
// Instead of sending 100K rows (100K tokens)
// Send aggregated summary (5K tokens)
function aggregateForAI(campaigns) {
  return campaigns.map(c => ({
    name: c.campaignName,
    spend: c.spend,
    sales: c.sales,
    acos: c.acos,
    topKeywords: c.keywords
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10) // Only top 10 keywords
  }));
}
```

**2. Prompt Caching (75% Cost Reduction)**

```javascript
// Cache system prompt (reused across requests)
const SYSTEM_PROMPT = `You are an Amazon PPC expert...`; // 10K tokens

// First request: Pay full price
// Subsequent requests: Pay 25% for cached portion
```

**3. Batch Processing**

```javascript
// Analyze 50 campaigns in one request instead of 50 separate requests
async function batchAnalyze(campaigns) {
  const batches = chunk(campaigns, 50);
  
  return Promise.all(
    batches.map(batch => analyzeBleedingKeywords(batch))
  );
}
```

### Rate Limiting & Cost Controls

```javascript
// /src/lib/ai/rate-limiter.js
export class AIRateLimiter {
  constructor(maxRequestsPerMinute = 15, maxTokensPerDay = 1000000) {
    this.maxRPM = maxRequestsPerMinute;
    this.maxTokensPerDay = maxTokensPerDay;
    this.requestQueue = [];
    this.dailyTokenUsage = 0;
  }
  
  async throttle(fn, estimatedTokens) {
    // Check daily token limit
    if (this.dailyTokenUsage + estimatedTokens > this.maxTokensPerDay) {
      throw new Error('Daily token limit exceeded');
    }
    
    // Check rate limit
    const now = Date.now();
    this.requestQueue = this.requestQueue.filter(t => now - t < 60000);
    
    if (this.requestQueue.length >= this.maxRPM) {
      const oldestRequest = this.requestQueue[0];
      const waitTime = 60000 - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.requestQueue.push(Date.now());
    
    const result = await fn();
    this.dailyTokenUsage += estimatedTokens;
    
    return result;
  }
}
```

---

## UI/UX Design System: "Obsidian & Emerald"

### Color Palette

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // Obsidian (Dark backgrounds)
        obsidian: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#0a0a0a', // Primary background
        },
        // Emerald (Accent & success)
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981', // Primary accent
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Semantic colors
        success: '#34d399',
        warning: '#fbbf24',
        danger: '#ef4444',
        info: '#3b82f6',
      }
    }
  },
  darkMode: 'class'
}
```

### Typography System

```javascript
// Font stack
const fontFamily = {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'Consolas', 'monospace']
};

// Type scale
const fontSize = {
  xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
  sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
  base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
  lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
  xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
};
```

### Component Library

#### Button Component

```jsx
// /src/components/ui/Button.jsx
export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  loading = false,
  ...props 
}) {
  const baseStyles = 'rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-obsidian-950';
  
  const variants = {
    primary: 'bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-500',
    secondary: 'bg-obsidian-800 hover:bg-obsidian-700 text-gray-100 focus:ring-obsidian-600',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
    ghost: 'bg-transparent hover:bg-obsidian-800 text-gray-300 focus:ring-obsidian-600'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <Spinner size="sm" />
          {children}
        </span>
      ) : children}
    </button>
  );
}
```

#### Card Component

```jsx
// /src/components/ui/Card.jsx
export function Card({ title, subtitle, children, actions }) {
  return (
    <div className="bg-obsidian-900 border border-obsidian-700 rounded-lg p-6 shadow-lg">
      {(title || subtitle) && (
        <div className="mb-4 flex items-start justify-between">
          <div>
            {title && (
              <h3 className="text-xl font-semibold text-gray-50">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex gap-2">{actions}</div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
```

#### Metric Display Component

```jsx
// /src/components/ui/MetricCard.jsx
export function MetricCard({ 
  label, 
  value, 
  change, 
  trend, 
  format = 'number',
  icon 
}) {
  const formatValue = (val) => {
    switch (format) {
      case 'currency':
        return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      case 'percentage':
        return `${val.toFixed(2)}%`;
      default:
        return val.toLocaleString();
    }
  };
  
  const trendColor = trend === 'up' ? 'text-emerald-400' : 'text-red-400';
  const TrendIcon = trend === 'up' ? ArrowUpIcon : ArrowDownIcon;
  
  return (
    <div className="bg-obsidian-900 border border-obsidian-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-400">{label}</span>
        {icon && <span className="text-gray-500">{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-50">
          {formatValue(value)}
        </span>
        {change && (
          <span className={`flex items-center text-sm ${trendColor}`}>
            <TrendIcon className="w-4 h-4 mr-1" />
            {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );
}
```

#### Data Table Component

```jsx
// /src/components/ui/DataTable.jsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function DataTable({ columns, data, onRowClick }) {
  const parentRef = useRef();
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 10
  });
  
  return (
    <div className="bg-obsidian-900 border border-obsidian-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-obsidian-800 border-b border-obsidian-700">
        {columns.map(col => (
          <div key={col.key} className={`text-sm font-medium text-gray-300 ${col.className}`}>
            {col.label}
          </div>
        ))}
      </div>
      
      {/* Virtual scrolling body */}
      <div ref={parentRef} className="h-[600px] overflow-auto">
        <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualizer.getVirtualItems().map(virtualRow => {
            const row = data[virtualRow.index];
            return (
              <div
                key={virtualRow.index}
                className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-obsidian-800 hover:bg-obsidian-800 cursor-pointer transition-colors"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`
                }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <div key={col.key} className={`text-sm text-gray-200 ${col.className}`}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

### Responsive Grid System

```jsx
// Mobile-first responsive layout
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  <MetricCard label="ROAS" value={3.45} format="number" />
  <MetricCard label="ACoS" value={28.5} format="percentage" />
  <MetricCard label="Total Spend" value={12450} format="currency" />
  <MetricCard label="Total Sales" value={42955} format="currency" />
</div>
```

### Loading States

```jsx
// Skeleton loader
export function SkeletonCard() {
  return (
    <div className="bg-obsidian-900 border border-obsidian-700 rounded-lg p-6 animate-pulse">
      <div className="h-4 bg-obsidian-700 rounded w-1/4 mb-4"></div>
      <div className="h-8 bg-obsidian-700 rounded w-1/2 mb-2"></div>
      <div className="h-3 bg-obsidian-700 rounded w-1/3"></div>
    </div>
  );
}
```

### Toast Notifications

```jsx
// /src/components/ui/Toast.jsx
import { Toaster, toast } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      theme="dark"
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#1f2937',
          color: '#f9fafb',
          border: '1px solid #374151'
        },
        className: 'font-sans'
      }}
    />
  );
}

// Usage
toast.success('Bid updated successfully');
toast.error('Failed to load data');
toast.info('Analysis in progress...');
```

---

## Accessibility Standards

### WCAG 2.1 AA Compliance

**Color Contrast:**
- Text on background: Minimum 4.5:1 ratio
- Large text (18px+): Minimum 3:1 ratio
- Emerald 500 (#10b981) on Obsidian 950 (#0a0a0a): 7.2:1 ✓

**Keyboard Navigation:**
```jsx
// All interactive elements must be keyboard accessible
<button
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Action
</button>
```

**Screen Reader Support:**
```jsx
<button aria-label="Pause keyword: wireless earbuds">
  <PauseIcon aria-hidden="true" />
</button>
```

**Focus Indicators:**
```css
/* Always visible focus rings */
.focus-visible:focus {
  outline: 2px solid #10b981;
  outline-offset: 2px;
}
```

---

## Next Steps

1. **Review Part 2:** Validate AI prompts and design system
2. **Proceed to Part 3:** Implementation Roadmap and Success Metrics

---

**Document Status:** Part 2 Complete  
**Next Document:** TECH_SPECS_PART3.md (Implementation Roadmap)