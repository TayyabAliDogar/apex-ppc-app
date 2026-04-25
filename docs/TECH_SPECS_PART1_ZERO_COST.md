# VibePPC Command Center
## Technical Specifications - Part 1: Zero-Cost Architecture

**Version:** 2.0 (Zero-Cost Revision)  
**Last Updated:** April 15, 2026  
**Companion Documents:** PROJECT_CONSTITUTION.md, TECH_SPECS_PART2.md, TECH_SPECS_PART3.md

---

## Architecture Overview - Zero-Cost Model

VibePPC Command Center follows a **100% client-side, zero-infrastructure-cost architecture**. All processing happens in the browser, with no backend servers, databases, or paid cloud services.

### Core Principle: Browser-First, Server-Never

**Architecture Layers:**
1. **Presentation Layer** (React PWA)
2. **Processing Layer** (Web Workers + Client-side AI)
3. **Storage Layer** (IndexedDB only)

### Zero-Cost Architecture Principles

- **No Backend:** All logic runs in the browser (JavaScript/Web Workers)
- **No Database Servers:** IndexedDB is the only database
- **No Cloud Storage:** Files stored in IndexedDB as blobs
- **Free AI Tier:** Gemini 1.5 Flash free tier (15 RPM, 1500 RPD)
- **No Authentication Server:** Local-only data (no user accounts)
- **No CDN Costs:** Static hosting on free tier (Vercel/Netlify/GitHub Pages)

---

## Technology Stack - Zero-Cost Edition

### Frontend Application (React PWA)

```
React 18.3+ (Client-side only)
├── Vite 6.0+ (Build tool, free hosting on Vercel)
├── Tailwind CSS 3.4+ (No runtime cost)
├── Framer Motion 11+ (Animation library, zero-cost)
├── React Router 6+ (Client-side routing)
├── Zustand 4+ (Client state, no server)
├── PapaParse 5+ (CSV parsing in browser)
├── Recharts 2+ (Client-side charts)
├── date-fns 3+ (Date manipulation)
├── Dexie.js 4+ (IndexedDB wrapper)
└── Workbox 7+ (Service Worker, offline support)
```

**Cost:** $0/month (all client-side libraries)

**Animation System (Framer Motion):**
- Professional page transitions (fade, slide, scale)
- Hover effects: scale(1.05) + emerald glow
- Stagger animations for lists
- Bundle size: ~35KB gzipped (acceptable)
- Zero runtime cost, client-side only

### AI Integration (Gemini Free Tier)

```
@google/generative-ai SDK
├── Gemini 1.5 Flash (Free tier)
├── 15 requests per minute (RPM)
├── 1,500 requests per day (RPD)
├── 1 million tokens per day
└── API key exposed client-side (risk accepted)
```

**Cost:** $0/month (free tier limits enforced)

### Storage (IndexedDB Only)

```
IndexedDB (Browser native)
├── Dexie.js 4+ (Promise-based wrapper)
├── Storage quota: 50MB-1GB (browser dependent)
├── No server sync
├── Local-only data
└── Cleared when user clears browser data
```

**Cost:** $0/month (browser native)

### Hosting (Static Site)

```
Vercel Free Tier / Netlify Free / GitHub Pages
├── Static site hosting (React build output)
├── Automatic HTTPS
├── Global CDN
├── 100GB bandwidth/month (Vercel free)
└── Unlimited builds
```

**Cost:** $0/month (free tier sufficient for MVP)

---

## System Architecture Diagram - Zero-Cost

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│  (Chrome, Safari, Firefox - All processing happens here)        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REACT PWA (Client-Only)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ CSV Upload   │  │  Dashboard   │  │ AI Insights  │          │
│  │   Engine     │  │   (Charts)   │  │    Panel     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│  ┌──────▼──────────────────▼──────────────────▼───────┐         │
│  │         IndexedDB (Local Storage Only)              │         │
│  │  - Campaigns (up to 50MB-1GB browser limit)        │         │
│  │  - Keywords                                         │         │
│  │  - AI Insights Cache (24-hour TTL)                 │         │
│  │  - Settings                                         │         │
│  │  - NO SERVER SYNC                                   │         │
│  └─────────────────────────────────────────────────────┘         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────┐         │
│  │      Web Workers (Background Processing)            │         │
│  │  - CSV parsing (PapaParse)                          │         │
│  │  - Metric calculations                              │         │
│  │  - Data aggregation                                 │         │
│  └─────────────────────────────────────────────────────┘         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────┐         │
│  │      Service Worker (Workbox)                       │         │
│  │  - Offline support                                  │         │
│  │  - Cache static assets                              │         │
│  │  - NO background sync (no server)                   │         │
│  └─────────────────────────────────────────────────────┘         │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS (Direct API call)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              GEMINI API (Free Tier - Direct Call)                │
│  ⚠️ API KEY EXPOSED IN CLIENT CODE (Security Risk)              │
│  - 15 requests per minute (RPM)                                  │
│  - 1,500 requests per day (RPD)                                  │
│  - 1M tokens per day                                             │
│  - NO server proxy (cost savings)                                │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   STATIC HOSTING (Vercel Free)                   │
│  - React build output (HTML, JS, CSS)                           │
│  - Global CDN                                                    │
│  - 100GB bandwidth/month                                         │
│  - Automatic HTTPS                                               │
│  - NO server-side code                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## Network Resilience & Development Server Configuration

### Local Development Server (Vite)

**Requirements for Mobile Testing:**

```javascript
// vite.config.js - Production Configuration
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Bind to all network interfaces (allows mobile access)
    port: 5182,      // Fixed port for consistency
    strictPort: true // Fail if port is unavailable (don't auto-increment)
  }
});
```

**Network Binding Strategy:**
- `host: '0.0.0.0'` - Binds to all network interfaces (localhost + LAN)
- `host: true` - Vite shorthand for '0.0.0.0'
- `port: 5182` - Fixed port to avoid ngrok tunnel updates
- `strictPort: true` - Prevents port conflicts by failing fast

**Why Port 5182:**
- Ports 5173-5181 may be occupied by previous dev server instances
- Fixed port ensures ngrok tunnel stability
- Consistent URL for mobile testing across sessions

**Network Access URLs:**
- **Localhost**: http://localhost:5182/
- **LAN (Mobile)**: http://[LOCAL_IP]:5182/ (e.g., http://10.51.200.220:5182/)
- **Public (Ngrok)**: https://[subdomain].ngrok-free.dev

**Firewall Configuration:**
- Windows: Allow Node.js through Windows Defender Firewall
- macOS: Allow incoming connections for Node in System Preferences
- Linux: Configure iptables to allow port 5182

**Mobile Testing Workflow:**
1. Start dev server: `npm run dev`
2. Note LAN IP from Vite output (e.g., 10.51.200.220:5182)
3. Open on mobile browser: http://[LAN_IP]:5182/
4. For external testing: Use ngrok tunnel

**Network Resilience Features:**
- Hot Module Replacement (HMR) works over LAN
- WebSocket connection for live reload
- Automatic reconnection on network interruption
- CORS enabled for local development

---

## Core Components - Zero-Cost Implementation

### 1. CSV Upload & Processing Engine (Client-Side Only)

**Responsibilities:**
- Accept Amazon Bulk Reports (CSV format, up to 50MB)
- Parse in Web Worker (non-blocking)
- Store in IndexedDB (browser storage quota applies)
- No server upload (all processing local)

**Storage Limits:**
- Chrome: ~60% of available disk space (typically 1GB+)
- Firefox: 50MB default, can request more
- Safari: 50MB-1GB depending on device
- Edge: Similar to Chrome

**Implementation:**

```javascript
// /src/lib/csv-processor.js (Client-side only)
import Papa from 'papaparse';
import { db } from './db';

export async function processCSVFile(file) {
  // Check browser storage quota first
  const quota = await navigator.storage.estimate();
  const availableMB = (quota.quota - quota.usage) / (1024 * 1024);
  
  if (file.size / (1024 * 1024) > availableMB * 0.8) {
    throw new Error(`Insufficient storage. Available: ${availableMB.toFixed(0)}MB`);
  }

  return new Promise((resolve, reject) => {
    const worker = new Worker('/csv-worker.js');
    
    worker.onmessage = async (e) => {
      if (e.data.type === 'chunk') {
        await db.campaigns.bulkAdd(e.data.data);
      }
      if (e.data.type === 'complete') {
        resolve(e.data);
      }
      if (e.data.type === 'error') {
        reject(new Error(e.data.error));
      }
    };
    
    worker.postMessage({ file });
  });
}
```

**Constraints:**
- Maximum file size: 50MB (browser memory limit)
- Maximum rows: ~100K (IndexedDB performance limit)
- No cloud backup (data lost if browser cleared)

### 2. IndexedDB Storage Layer (Dexie.js)

**Schema Design:**

```javascript
// /src/lib/db.js
import Dexie from 'dexie';

export const db = new Dexie('VibePPC');

db.version(1).stores({
  campaigns: '++id, campaignName, date, spend, sales, acos, roas, createdAt',
  keywords: '++id, keyword, campaignId, bid, spend, conversions, acos',
  insights: '++id, type, severity, createdAt, resolvedAt',
  forecasts: '++id, generatedAt, forecastDate, predictedSales, predictedSpend',
  aiCache: 'hash, response, timestamp', // Cache AI responses (24hr TTL)
  settings: 'key, value'
});

// Automatic cleanup (30-day retention)
db.campaigns.hook('reading', (obj) => {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  if (obj.createdAt < thirtyDaysAgo) {
    return undefined; // Filter out old data
  }
  return obj;
});
```

**Storage Quota Management:**

```javascript
// Monitor storage usage
export async function getStorageInfo() {
  const estimate = await navigator.storage.estimate();
  
  return {
    used: estimate.usage,
    quota: estimate.quota,
    usedMB: (estimate.usage / (1024 * 1024)).toFixed(2),
    quotaMB: (estimate.quota / (1024 * 1024)).toFixed(2),
    percentUsed: ((estimate.usage / estimate.quota) * 100).toFixed(1)
  };
}

// Request persistent storage (prevents eviction)
export async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist();
    return isPersisted;
  }
  return false;
}
```

### 3. Gemini AI Integration (Free Tier, Client-Side)

**Free Tier Limits:**
- 15 requests per minute (RPM)
- 1,500 requests per day (RPD)
- 1 million tokens per day
- No prompt caching on free tier

**⚠️ Security Trade-off:**
API key must be exposed in client code (no backend to hide it). This is acceptable for free tier but risky for paid tier.

**Implementation:**

```javascript
// /src/lib/ai-client.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// ⚠️ API KEY EXPOSED - Only use free tier key
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Rate limiter (client-side)
class RateLimiter {
  constructor() {
    this.requests = [];
    this.dailyRequests = 0;
    this.lastResetDate = new Date().toDateString();
  }

  async checkLimit() {
    // Reset daily counter
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailyRequests = 0;
      this.lastResetDate = today;
    }

    // Check daily limit (1500 RPD)
    if (this.dailyRequests >= 1500) {
      throw new Error('Daily AI request limit reached (1500). Try again tomorrow.');
    }

    // Check per-minute limit (15 RPM)
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < 60000);
    
    if (this.requests.length >= 15) {
      const oldestRequest = this.requests[0];
      const waitTime = 60000 - (now - oldestRequest);
      throw new Error(`Rate limit: Wait ${Math.ceil(waitTime / 1000)}s before next request`);
    }

    this.requests.push(now);
    this.dailyRequests++;
  }
}

const rateLimiter = new RateLimiter();

export async function analyzeWithGemini(prompt, data) {
  await rateLimiter.checkLimit();

  // Check cache first (24-hour TTL)
  const cacheKey = hashPrompt(prompt, data);
  const cached = await db.aiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
    return cached.response;
  }

  // Call Gemini API
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const result = await model.generateContent(prompt);
  const response = result.response.text();

  // Cache response
  await db.aiCache.put({
    hash: cacheKey,
    response,
    timestamp: Date.now()
  });

  return response;
}

function hashPrompt(prompt, data) {
  return btoa(JSON.stringify({ prompt, data })).substring(0, 32);
}
```

**Cost:** $0/month (free tier)

**Risks:**
- API key can be extracted from client code
- Rate limits are strict (15 RPM, 1500 RPD)
- No server-side validation
- Users can abuse the key if extracted

### 4. Financial Dashboard (Client-Side Calculations)

**All metrics calculated in browser:**

```javascript
// /src/lib/metrics.js (Pure client-side)

export function calculateROAS(sales, spend) {
  return spend > 0 ? sales / spend : 0;
}

export function calculateACoS(spend, sales) {
  return sales > 0 ? (spend / sales) * 100 : 0;
}

export function calculateTACoS(adSpend, totalRevenue) {
  return totalRevenue > 0 ? (adSpend / totalRevenue) * 100 : 0;
}

export function calculateWastedSpend(keywords) {
  return keywords
    .filter(k => k.conversions === 0 && k.spend > 50)
    .reduce((sum, k) => sum + k.spend, 0);
}

export async function calculateDashboardMetrics(startDate, endDate) {
  const campaigns = await db.campaigns
    .where('date')
    .between(startDate, endDate)
    .toArray();

  const totalSales = campaigns.reduce((sum, c) => sum + c.sales, 0);
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);

  return {
    roas: calculateROAS(totalSales, totalSpend),
    acos: calculateACoS(totalSpend, totalSales),
    totalSales,
    totalSpend
  };
}
```

**Performance:** All calculations happen in <100ms for 100K rows

---

## Data Flow Patterns - Zero-Cost

### Flow 1: User Uploads Amazon Report (No Server)

```
1. User selects CSV file (browser file picker)
   ↓
2. File validated (size, format) in browser
   ↓
3. File sent to Web Worker (non-blocking)
   ↓
4. PapaParse streams file in chunks
   ↓
5. Each chunk stored in IndexedDB
   ↓
6. Progress bar updates in real-time
   ↓
7. On completion, dashboard auto-refreshes
   ↓
8. NO SERVER UPLOAD (all local)
```

### Flow 2: User Views Financial Dashboard (No API Calls)

```
1. User navigates to /dashboard
   ↓
2. Query IndexedDB for campaigns (date range)
   ↓
3. Calculate metrics in browser (ROAS, ACoS, etc.)
   ↓
4. Render charts with Recharts (client-side)
   ↓
5. NO API CALLS (all data local)
```

### Flow 3: AI-Powered Analysis (Direct Gemini Call)

```
1. User clicks "Analyze Bleeding Keywords"
   ↓
2. Check rate limiter (15 RPM, 1500 RPD)
   ↓
3. Check IndexedDB cache (24-hour TTL)
   ↓
4. If cache MISS: Call Gemini API directly from browser
   ↓
5. ⚠️ API key exposed in client code
   ↓
6. Parse AI response (JSON)
   ↓
7. Cache in IndexedDB (24 hours)
   ↓
8. Display recommendations
   ↓
9. NO SERVER PROXY (cost savings, security risk)
```

---

## Cost Breakdown - Zero-Cost Architecture

| Component | Service | Monthly Cost |
|-----------|---------|--------------|
| Frontend Hosting | Vercel Free Tier | $0 |
| Database | IndexedDB (browser) | $0 |
| Backend API | None (client-only) | $0 |
| AI Processing | Gemini Free Tier | $0 |
| File Storage | IndexedDB (browser) | $0 |
| CDN | Vercel CDN (free) | $0 |
| SSL Certificate | Vercel (included) | $0 |
| Monitoring | Browser DevTools | $0 |
| **TOTAL** | | **$0/month** |

**Break-even:** N/A (no costs)  
**Scalability:** Limited by browser storage and Gemini free tier

---

## Constraints & Limitations - Zero-Cost Model

### Storage Constraints

**Browser Storage Limits:**
- Chrome: ~60% of available disk (typically 1-10GB)
- Firefox: 50MB default, can request up to 2GB
- Safari: 50MB-1GB depending on device
- Mobile browsers: 50-500MB typically

**Practical Limits:**
- Maximum CSV file size: 50MB
- Maximum campaigns stored: ~100K rows
- Data retention: 30 days (automatic cleanup)
- No cross-device sync
- Data lost if user clears browser

### AI Constraints

**Gemini Free Tier Limits:**
- 15 requests per minute (RPM)
- 1,500 requests per day (RPD)
- 1 million tokens per day
- No prompt caching (paid feature)
- API key exposed client-side

**Practical Impact:**
- Users can analyze ~100 campaigns per day
- Must wait 4 seconds between requests
- Heavy users will hit daily limit
- API key can be stolen and abused

### Performance Constraints

**Browser Performance:**
- CSV parsing: 50MB file in 10-20 seconds
- IndexedDB queries: <100ms for 100K rows
- Chart rendering: <1 second for 30 days data
- Memory usage: <500MB peak

**No Server-Side Processing:**
- All calculations happen in browser
- Older devices will be slower
- No background processing when tab closed
- No scheduled tasks (no cron jobs)

### Security Constraints

**No Backend Security:**
- API keys exposed in client code
- No user authentication
- No data encryption at rest
- No audit logging
- No rate limiting enforcement (client-side only)

**Data Privacy:**
- All data stored locally (good for privacy)
- No server-side data collection
- No analytics (unless client-side)
- No backup/recovery

---

## Deployment Strategy - Zero-Cost

### Static Site Hosting (Vercel Free Tier)

**Setup:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# Automatic deployments on git push
vercel link
```

**Vercel Free Tier Limits:**
- 100GB bandwidth/month
- Unlimited builds
- Automatic HTTPS
- Global CDN
- Custom domain support

**Alternative Free Hosts:**
- Netlify Free (100GB bandwidth)
- GitHub Pages (1GB storage, unlimited bandwidth)
- Cloudflare Pages (unlimited bandwidth)

### Environment Variables

```bash
# .env.local (NOT committed to git)
VITE_GEMINI_API_KEY=your_free_tier_key_here
```

**⚠️ Security Warning:**
Even with `.env.local`, the API key will be bundled into the client JavaScript. Anyone can extract it from the browser DevTools.

**Mitigation:**
- Use a separate free tier key for production
- Monitor usage in Google AI Studio
- Regenerate key if abused
- Accept this risk for zero-cost model

---

## Risk Assessment - Zero-Cost Architecture

### Critical Risks

**Risk 1: Browser Storage Eviction**
- **Probability:** Medium
- **Impact:** High (data loss)
- **Mitigation:** Request persistent storage, warn users, export functionality

**Risk 2: Gemini API Key Theft**
- **Probability:** High
- **Impact:** Medium (free tier abuse)
- **Mitigation:** Monitor usage, regenerate key, rate limiting

**Risk 3: Browser Storage Quota Exceeded**
- **Probability:** High (power users)
- **Impact:** High (cannot upload more data)
- **Mitigation:** 30-day retention, storage warnings, data export

**Risk 4: Gemini Rate Limit Hit**
- **Probability:** High (active users)
- **Impact:** Medium (cannot use AI features)
- **Mitigation:** Client-side rate limiter, cache aggressively, clear error messages

**Risk 5: No Data Backup**
- **Probability:** Low
- **Impact:** Critical (permanent data loss)
- **Mitigation:** Export to CSV, warn users, no recovery possible

---

## Next Steps

1. **QA Audit:** Review this zero-cost architecture for additional risks
2. **User Approval:** Get sign-off before implementation
3. **Prototype:** Build minimal version to test constraints
4. **User Testing:** Validate with real Amazon sellers

---

**Document Status:** Zero-Cost Architecture Complete - Awaiting QA Audit  
**Total Monthly Cost:** $0  
**Scalability:** Limited by browser storage and free tier limits