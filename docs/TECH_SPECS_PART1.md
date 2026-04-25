# VibePPC Command Center
## Technical Specifications - Part 1: Architecture & Data Flow

**Version:** 1.0  
**Last Updated:** April 15, 2026  
**Companion Documents:** PROJECT_CONSTITUTION.md, TECH_SPECS_PART2.md, TECH_SPECS_PART3.md

---

## Architecture Overview

VibePPC Command Center follows a **serverless, client-heavy architecture** optimized for cost efficiency, scalability, and rapid iteration. The system is composed of three primary layers:

1. **Presentation Layer** (React PWA)
2. **Intelligence Layer** (Gemini AI + Processing Logic)
3. **Data Layer** (Cloud Storage + Caching)

### Architecture Principles

- **Client-Heavy Processing:** Offload CSV parsing and basic calculations to client (reduces server costs)
- **Stateless Services:** All backend services are stateless for horizontal scaling
- **Progressive Enhancement:** Core features work offline, enhanced features require connectivity
- **Cost-Conscious Design:** Minimize API calls, maximize caching, optimize AI token usage
- **Speed as a Feature:** Target <2s page load, <10s CSV parsing (50MB files)

---

## Technology Stack

### Frontend Application (React PWA)

```
React 18.3+ (with Concurrent Features)
├── Vite 6.0+ (Build tool & dev server)
├── Tailwind CSS 3.4+ (Styling & Dark Mode)
├── React Router 6+ (Client-side routing)
├── TanStack Query 5+ (Server state management)
├── Zustand 4+ (Client state management)
├── PapaParse 5+ (CSV parsing)
├── Recharts 2+ (Data visualization)
├── date-fns 3+ (Date manipulation)
├── Dexie.js 4+ (IndexedDB wrapper)
└── Workbox 7+ (Service Worker & PWA features)
```

**Why These Choices:**
- **Vite:** Lightning-fast dev server, optimized production builds
- **Tailwind CSS:** Rapid styling, built-in dark mode, small bundle size
- **TanStack Query:** Automatic caching, background refetching, optimistic updates
- **Zustand:** Minimal boilerplate, TypeScript-friendly, <1KB
- **PapaParse:** Streaming CSV parsing, handles 50MB+ files, excellent error handling
- **Recharts:** Responsive charts, composable API, tree-shakeable
- **Dexie.js:** Promise-based IndexedDB, handles 100K+ rows efficiently

### Backend Services (Google Cloud Run)

```
Node.js 20+ LTS
├── Fastify 4+ (Web framework - faster than Express)
├── @google/generative-ai (Gemini SDK)
├── @google-cloud/secret-manager (API key storage)
├── ioredis 5+ (Redis client for caching)
├── zod 3+ (Schema validation)
└── pino 9+ (Structured logging)
```

**Why These Choices:**
- **Fastify:** 2x faster than Express, built-in schema validation
- **Cloud Run:** Auto-scaling, pay-per-use, regional deployment
- **Redis:** Sub-millisecond caching, 75% cost reduction with prompt caching
- **Zod:** Runtime type safety, automatic TypeScript inference

### Data Layer

```
Google Cloud Platform
├── Firestore (Primary database - NoSQL)
├── Cloud Memorystore (Redis - Caching layer)
├── Cloud Storage (File storage - CSV uploads, reports)
├── Secret Manager (API keys, credentials)
└── Cloud CDN (Static asset delivery)
```

**Why These Choices:**
- **Firestore:** Serverless, real-time sync, offline support, strong consistency
- **Redis:** Prompt caching reduces Gemini costs by 75%
- **Cloud Storage:** Encrypted at rest, lifecycle policies, regional replication
- **Secret Manager:** Automatic rotation, audit logging, IAM integration

---

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DEVICES                             │
│  (Mobile, Tablet, Desktop - Chrome, Safari, Firefox)            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REACT PWA (Client)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ CSV Upload   │  │  Dashboard   │  │ AI Insights  │          │
│  │   Engine     │  │   (Charts)   │  │    Panel     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                  │                  │                  │
│  ┌──────▼──────────────────▼──────────────────▼───────┐         │
│  │         IndexedDB (Offline Storage)                 │         │
│  │  - Campaigns (100K+ rows)                           │         │
│  │  - Keywords                                         │         │
│  │  - AI Insights Cache                                │         │
│  └─────────────────────────────────────────────────────┘         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────┐         │
│  │      Service Worker (Workbox)                       │         │
│  │  - Offline support                                  │         │
│  │  - Background sync                                  │         │
│  │  - Push notifications                               │         │
│  └─────────────────────────────────────────────────────┘         │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS (TLS 1.3)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CLOUD CDN (Static Assets)                      │
│  - React bundle (gzipped)                                        │
│  - Images, fonts                                                 │
│  - Service Worker                                                │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              API GATEWAY (Cloud Run - Fastify)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Auth         │  │ Rate Limiter │  │  Validator   │          │
│  │ Middleware   │  │ (per user)   │  │   (Zod)      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         └──────────────────┴──────────────────┘                  │
│                         │                                        │
│  Endpoints:                                                      │
│  POST /v1/auth/login                                             │
│  POST /v1/data/upload                                            │
│  POST /v1/ai/analyze                                             │
│  GET  /v1/insights/bleeding                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│   FIRESTORE    │ │  REDIS CACHE   │ │  AI ENGINE     │
│   (Database)   │ │ (Memorystore)  │ │ (Cloud Run)    │
│                │ │                │ │                │
│ - users/       │ │ - Prompt cache │ │ ┌────────────┐ │
│ - campaigns/   │ │ - Session data │ │ │  Gemini    │ │
│ - keywords/    │ │ - AI responses │ │ │ 1.5 Flash  │ │
│ - insights/    │ │ (TTL: 1-24hr)  │ │ │    API     │ │
│ - forecasts/   │ │                │ │ └────────────┘ │
└────────────────┘ └────────────────┘ └────────────────┘
         │                                      │
         │                                      ▼
         │                          ┌────────────────────┐
         │                          │  SECRET MANAGER    │
         │                          │  - Gemini API key  │
         │                          │  - Amazon SP-API   │
         │                          └────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│              CLOUD STORAGE (Buckets)                   │
│  - user-uploads/ (CSV files, 90-day retention)         │
│  - reports/ (PDF/CSV exports, 1-year retention)        │
│  - backups/ (Database backups, 7-year retention)       │
└────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. CSV Upload & Processing Engine

**Responsibilities:**
- Accept Amazon Bulk Reports (CSV format, up to 100MB)
- Validate schema against expected columns
- Parse and normalize data client-side (Web Worker)
- Detect data quality issues (missing fields, invalid dates)
- Store processed data in IndexedDB for offline access

**Technical Implementation:**

```javascript
// /src/lib/csv-worker.js
importScripts('https://cdn.jsdelivr.net/npm/papaparse@5/papaparse.min.js');

self.onmessage = (e) => {
  const { file, chunkSize = 5000 } = e.data;
  
  Papa.parse(file, {
    worker: false, // Already in worker
    chunk: (results, parser) => {
      // Validate chunk
      const validRows = results.data.filter(validateRow);
      
      // Send to main thread
      self.postMessage({
        type: 'chunk',
        data: validRows,
        errors: results.errors
      });
      
      // Memory management
      if (performance.memory?.usedJSHeapSize > 200 * 1024 * 1024) {
        parser.pause();
        self.postMessage({ type: 'pause', reason: 'memory' });
      }
    },
    complete: () => {
      self.postMessage({ type: 'complete' });
    },
    error: (error) => {
      self.postMessage({ type: 'error', error });
    },
    skipEmptyLines: true,
    header: true
  });
};

function validateRow(row) {
  // Validate required Amazon columns
  return row.campaignName && row.spend && row.sales;
}
```

**Performance Targets:**
- 50MB file: <10 seconds parsing time
- 100K rows: <5 seconds IndexedDB write
- Memory usage: <200MB peak
- UI remains responsive (60fps) during parsing

### 2. IndexedDB Storage Layer (Dexie.js)

**Schema Design:**

```javascript
// /src/lib/db.js
import Dexie from 'dexie';

export const db = new Dexie('VibePPC');

db.version(1).stores({
  campaigns: '++id, campaignName, asin, date, impressions, clicks, spend, sales, acos, roas',
  keywords: '++id, keyword, campaignId, bid, matchType, conversions, spend, acos',
  insights: '++id, type, severity, campaignId, keywordId, createdAt, resolvedAt',
  forecasts: '++id, userId, generatedAt, forecastDate, predictedSales, predictedSpend',
  aiCache: 'hash, response, timestamp' // Cache AI responses
});

// Indexes for fast queries
db.campaigns.hook('creating', (primKey, obj) => {
  obj.createdAt = Date.now();
});

// Automatic cleanup (30-day retention)
db.campaigns.hook('reading', async (obj) => {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  if (obj.createdAt < thirtyDaysAgo) {
    await db.campaigns.delete(obj.id);
    return undefined; // Don't return deleted record
  }
  return obj;
});
```

**Query Patterns:**

```javascript
// Get top bleeding keywords
async function getBleedingKeywords(limit = 10) {
  return await db.keywords
    .where('acos').above(50) // ACoS > 50%
    .and(k => k.spend > 100) // Spend > $100
    .sortBy('spend')
    .then(results => results.reverse().slice(0, limit));
}

// Calculate ROAS for date range
async function calculateROAS(startDate, endDate) {
  const campaigns = await db.campaigns
    .where('date').between(startDate, endDate)
    .toArray();
  
  const totalSales = campaigns.reduce((sum, c) => sum + c.sales, 0);
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  
  return totalSpend > 0 ? totalSales / totalSpend : 0;
}
```

### 3. Financial Dashboard Engine

**Responsibilities:**
- Real-time ROAS, TACoS, Wasted Spend calculations
- Date range filtering (Today, 7D, 30D, Custom)
- Campaign-level and keyword-level breakdowns
- Trend visualization with sparklines
- Export capabilities (CSV, PDF reports)

**Key Metrics Calculations:**

```javascript
// /src/lib/metrics.js

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

export function identifyBleedingKeywords(keywords, threshold = 50) {
  return keywords
    .filter(k => {
      const acos = calculateACoS(k.spend, k.sales);
      return acos > threshold && k.spend > 100;
    })
    .sort((a, b) => b.spend - a.spend);
}
```

---

## Data Flow Patterns

### Flow 1: User Uploads Amazon Report

```
1. User selects CSV file (50MB)
   ↓
2. React component validates file size/type
   ↓
3. File sent to Web Worker
   ↓
4. PapaParse streams file in 5K row chunks
   ↓
5. Each chunk validated and sent to main thread
   ↓
6. Main thread stores chunks in IndexedDB (Dexie)
   ↓
7. Progress bar updates in real-time
   ↓
8. On completion, trigger AI analysis (background)
   ↓
9. Dashboard auto-refreshes with new data
```

**Code Example:**

```javascript
// /src/components/CSVUploader.jsx
import { useState, useRef, useEffect } from 'react';
import { db } from '../lib/db';

export function CSVUploader() {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const workerRef = useRef(null);
  
  useEffect(() => {
    workerRef.current = new Worker('/csv-worker.js');
    
    workerRef.current.onmessage = async (e) => {
      const { type, data, errors } = e.data;
      
      if (type === 'chunk') {
        await db.campaigns.bulkAdd(data);
        setProgress(prev => prev + data.length);
      }
      
      if (type === 'complete') {
        setStatus('complete');
        // Trigger AI analysis
        await analyzeData();
      }
      
      if (type === 'error') {
        setStatus('error');
        console.error('CSV parsing error:', errors);
      }
    };
    
    return () => workerRef.current?.terminate();
  }, []);
  
  const handleFile = (file) => {
    if (file.size > 100 * 1024 * 1024) {
      alert('File too large (max 100MB)');
      return;
    }
    
    setStatus('parsing');
    setProgress(0);
    workerRef.current.postMessage({ file });
  };
  
  return (
    <div className="bg-gray-800 p-6 rounded-lg">
      <input 
        type="file" 
        accept=".csv" 
        onChange={(e) => handleFile(e.target.files[0])}
        className="hidden"
        id="csv-upload"
      />
      <label 
        htmlFor="csv-upload"
        className="cursor-pointer bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-lg"
      >
        Upload Amazon Report
      </label>
      
      {status === 'parsing' && (
        <div className="mt-4">
          <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-emerald-500 h-full transition-all"
              style={{ width: `${(progress / 100000) * 100}%` }}
            />
          </div>
          <p className="text-gray-300 text-sm mt-2">
            Processing {progress.toLocaleString()} rows...
          </p>
        </div>
      )}
    </div>
  );
}
```

### Flow 2: User Views Financial Dashboard

```
1. User navigates to /dashboard
   ↓
2. React component checks IndexedDB cache (offline-first)
   ↓
3. If cache HIT: Render immediately (perceived performance)
   ↓
4. If cache MISS or stale: Fetch from API
   ↓
5. API checks Redis cache (TTL: 5 minutes)
   ↓
6. If Redis MISS: Query Firestore
   ↓
7. Calculate aggregates (ROAS, TACoS, Wasted Spend)
   ↓
8. Cache result in Redis (TTL: 5 min)
   ↓
9. Return JSON to client
   ↓
10. Client renders charts, stores in IndexedDB
```

**Code Example:**

```javascript
// /src/hooks/useDashboardData.js
import { useQuery } from '@tanstack/react-query';
import { db } from '../lib/db';

export function useDashboardData(dateRange) {
  return useQuery({
    queryKey: ['dashboard', dateRange],
    queryFn: async () => {
      // Try IndexedDB first (offline-first)
      const cached = await db.campaigns
        .where('date').between(dateRange.start, dateRange.end)
        .toArray();
      
      if (cached.length > 0) {
        return calculateMetrics(cached);
      }
      
      // Fallback to API
      const response = await fetch('/api/v1/data/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateRange })
      });
      
      const data = await response.json();
      
      // Cache in IndexedDB
      await db.campaigns.bulkPut(data.campaigns);
      
      return calculateMetrics(data.campaigns);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000 // 30 minutes
  });
}

function calculateMetrics(campaigns) {
  const totalSales = campaigns.reduce((sum, c) => sum + c.sales, 0);
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0);
  
  return {
    roas: totalSales / totalSpend,
    acos: (totalSpend / totalSales) * 100,
    totalSales,
    totalSpend
  };
}
```

### Flow 3: AI-Powered Bid Optimization

```
1. User clicks "Optimize Bids" for keyword
   ↓
2. Client sends POST /v1/ai/optimize { keywordId, targetACoS }
   ↓
3. API Gateway authenticates (JWT)
   ↓
4. Fetch keyword performance history (Firestore)
   ↓
5. Check AI cache (Redis) for similar request
   ↓
6. If cache MISS: Call AI Processing Engine
   ↓
7. AI Engine builds prompt with context
   ↓
8. Call Gemini 1.5 Flash API (structured output)
   ↓
9. Parse recommendation (new bid, expected impact, confidence)
   ↓
10. Cache result (Redis, TTL: 1 hour)
   ↓
11. Return to client with explanation
   ↓
12. User reviews recommendation
   ↓
13. User clicks "Apply"
   ↓
14. POST /v1/actions/bid-update
   ↓
15. Update Firestore, invalidate cache
   ↓
16. Show success notification
```

---

## Performance Optimization Strategies

### 1. Bundle Size Optimization

**Target:** <200KB gzipped initial bundle

```javascript
// vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'charts': ['recharts'],
          'db': ['dexie']
        }
      }
    }
  }
}
```

### 2. Code Splitting

```javascript
// Lazy load routes
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Insights = lazy(() => import('./pages/Insights'));
const Forecasts = lazy(() => import('./pages/Forecasts'));
```

### 3. Virtual Scrolling (100K+ rows)

```javascript
import { useVirtualizer } from '@tanstack/react-virtual';

function CampaignTable({ campaigns }) {
  const parentRef = useRef();
  
  const virtualizer = useVirtualizer({
    count: campaigns.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Row height
    overscan: 10
  });
  
  return (
    <div ref={parentRef} className="h-screen overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <CampaignRow 
            key={virtualRow.index}
            campaign={campaigns[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

### 4. Service Worker Caching

```javascript
// /public/sw.js (Workbox)
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses (NetworkFirst)
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3
  })
);

// Cache images (CacheFirst)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'image-cache',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        }
      }
    ]
  })
);
```

---

## Cost Estimation (Monthly, 1000 Active Users)

### Infrastructure
- **Cloud Run (API Gateway):** ~$150 (auto-scaling, pay-per-use)
- **Cloud Run (AI Engine):** ~$100 (separate service)
- **Firestore:** ~$200 (reads/writes, storage)
- **Redis (Memorystore):** ~$100 (1GB instance)
- **Cloud Storage:** ~$50 (file storage, bandwidth)
- **Cloud CDN:** ~$75 (static asset delivery)

### AI & APIs
- **Gemini 1.5 Flash:** ~$50 (with 75% prompt caching, estimated 10M tokens/month)
- **Amazon SP-API:** $0 (free for sellers)

### Monitoring & Security
- **Cloud Monitoring:** ~$50 (logs, metrics, traces)
- **SSL Certificates:** $0 (Let's Encrypt)

**Total Estimated Cost:** ~$775/month (~$0.78 per active user)

**Revenue Model:**
- Free tier: 1 campaign, 1000 keywords
- Pro tier: $29/month (unlimited campaigns)
- Break-even: ~27 paying users
- Target: 20% conversion = 200 paying users = $5,800 revenue
- **Profit Margin:** ~85% at scale

---

## Next Steps

1. **Review Part 1:** Validate architecture decisions
2. **Proceed to Part 2:** AI Engine (Gemini prompts) and UI/UX Design System
3. **Proceed to Part 3:** Implementation Roadmap and Success Metrics

---

**Document Status:** Part 1 Complete  
**Next Document:** TECH_SPECS_PART2.md (AI Engine & Design System)