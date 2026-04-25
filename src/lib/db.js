import Dexie from 'dexie';

let db;
try {
  db = new Dexie('VibePPC');
} catch (error) {
  console.error('❌ CRITICAL: Dexie instantiation failed:', error);
  throw error;
}

export { db };

db.version(1).stores({ campaigns: '++id, campaignName, asin, date, impressions, clicks, spend, sales, acos, roas, createdAt, deleted', keywords: '++id, keyword, campaignId, bid, matchType, conversions, spend, acos, clicks, impressions, createdAt', insights: '++id, type, severity, campaignId, keywordId, createdAt, resolvedAt', forecasts: '++id, generatedAt, forecastDate, predictedSales, predictedSpend, confidence', aiCache: 'hash, response, timestamp, originalData', settings: 'key, value', errorLogs: '++id, message, stack, timestamp', analytics: '++id, event, properties, timestamp' });
db.version(2).stores({ campaigns: '++id, campaignName, asin, date, impressions, clicks, spend, sales, acos, roas, createdAt, deleted', keywords: '++id, keyword, campaignId, bid, matchType, conversions, spend, acos, clicks, impressions, createdAt', insights: '++id, type, severity, campaignId, keywordId, createdAt, resolvedAt', forecasts: '++id, generatedAt, forecastDate, predictedSales, predictedSpend, confidence', aiCache: 'hash, response, timestamp, originalData', settings: 'key, value', errorLogs: '++id, message, stack, timestamp', analytics: '++id, event, properties, timestamp' }).upgrade(async tx => { const campaigns = await tx.table('campaigns').toArray(); await Promise.all(campaigns.map(campaign => { if (campaign.deleted === undefined || campaign.deleted === null) { return tx.table('campaigns').update(campaign.id, { deleted: false }); } })); });
db.version(3).stores({ campaigns: '++id, campaignName, asin, date, impressions, clicks, spend, sales, acos, roas, createdAt', keywords: '++id, keyword, campaignId, bid, matchType, conversions, spend, acos, clicks, impressions, createdAt', insights: '++id, type, severity, campaignId, keywordId, createdAt, resolvedAt', forecasts: '++id, generatedAt, forecastDate, predictedSales, predictedSpend, confidence', aiCache: 'hash, response, timestamp, originalData', settings: 'key, value', errorLogs: '++id, message, stack, timestamp', analytics: '++id, event, properties, timestamp' }).upgrade(async tx => { const campaigns = await tx.table('campaigns').toArray(); for (const campaign of campaigns) { if (campaign.deleted === undefined || campaign.deleted === null) { await tx.table('campaigns').update(campaign.id, { deleted: false }); } } });
db.version(4).stores({ campaigns: '++id, campaignName, asin, date, impressions, clicks, spend, sales, acos, roas, createdAt', keywords: '++id, keyword, campaignId, bid, matchType, conversions, spend, acos, clicks, impressions, createdAt', insights: '++id, type, severity, campaignId, keywordId, createdAt, resolvedAt', forecasts: '++id, generatedAt, forecastDate, predictedSales, predictedSpend, confidence', aiCache: 'hash, response, timestamp, originalData', settings: 'key, value', errorLogs: '++id, message, stack, timestamp', analytics: '++id, event, properties, timestamp' }).upgrade(async tx => { const campaigns = await tx.table('campaigns').toArray(); for (const campaign of campaigns) { if (campaign.deleted === undefined || campaign.deleted === null) { await tx.table('campaigns').update(campaign.id, { deleted: false }); } } });
db.version(5).stores({ campaigns: '++id, campaignName, asin, date, impressions, clicks, spend, sales, acos, roas, createdAt', keywords: '++id, keyword, campaignId, bid, matchType, conversions, spend, acos, clicks, impressions, createdAt', insights: '++id, type, severity, campaignId, keywordId, createdAt, resolvedAt', forecasts: '++id, generatedAt, forecastDate, predictedSales, predictedSpend, confidence', aiCache: 'hash, response, timestamp, originalData', settings: 'key, value', errorLogs: '++id, message, stack, timestamp', analytics: '++id, event, properties, timestamp' });
db.version(6).stores({ campaigns: '++id, date', keywords: '++id', insights: '++id', forecasts: '++id', aiCache: 'hash', settings: 'key', errorLogs: '++id', analytics: '++id' });
db.version(7).stores({ campaigns: '++id, date', keywords: '++id', insights: '++id', forecasts: '++id', aiCache: 'hash', settings: 'key', errorLogs: '++id', analytics: '++id' });
db.version(8).stores({ campaigns: '++id, date', keywords: '++id', insights: '++id', forecasts: '++id', aiCache: 'hash', settings: 'key', errorLogs: '++id', analytics: '++id' });

// ============================================================
// THE FIX: Database Hook Normalizer (Fixes BOM files instantly)
// ============================================================
db.campaigns.hook('creating', (primKey, obj) => {
  if ('id' in obj) { delete obj.id; }
  obj.createdAt = Date.now();
  obj.deleted = false;

  // Agar file mein invisible BOM character hai, toh usey theek karo
  for (let key in obj) {
    let cleanKey = key.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (cleanKey === 'date' && !obj.date) {
      obj.date = obj[key];
    }
  }
});

db.keywords.hook('creating', (primKey, obj) => { if ('id' in obj) { delete obj.id; } obj.createdAt = Date.now(); });
db.insights.hook('creating', (primKey, obj) => { obj.createdAt = Date.now(); });

export async function initializeDatabase() {
  const { persistenceGuard } = await import('./persistence-guard.js');
  try {
    await persistenceGuard.execute(async () => await db.open(), 'Database Open');
    const currentVersion = db.verno;
    if (currentVersion < 8) {
      const resetResult = await nuclearResetWithTimeout();
      if (resetResult.success) { localStorage.setItem('db_nuclear_reset', 'true'); await new Promise(resolve => setTimeout(resolve, 200)); window.location.reload(); return { success: true, nuclearReset: true }; }
      else if (resetResult.needsManualReset) { return { success: false, needsManualReset: true, error: resetResult.error }; }
    }
    if (currentVersion !== 8) { throw new Error(`Invalid database version: ${currentVersion}. Expected V8.`); }
    return { success: true };
  } catch (error) {
    const isIndexCorruption = error.name === 'DataError' || error.message.includes('IDBKeyRange') || error.message.includes('not a valid key') || error.message.includes('bound');
    if (isIndexCorruption) {
      const resetResult = await emergencyNuclearResetWithTimeout();
      if (resetResult.needsManualReset) { return { success: false, needsManualReset: true, error: resetResult.error }; }
      return resetResult;
    }
    throw error;
  }
}

async function nuclearResetWithTimeout() {
  const TIMEOUT_MS = 5000;
  try { const resetPromise = nuclearResetNative(); const timeoutPromise = new Promise((_, reject) => { setTimeout(() => reject(new Error('Nuclear reset timeout')), TIMEOUT_MS); }); await Promise.race([resetPromise, timeoutPromise]); return { success: true }; }
  catch (error) { return { success: false, needsManualReset: true, error: error.message }; }
}

async function nuclearResetNative() {
  try { if (db.isOpen()) { db.close(); } } catch (e) {}
  await new Promise(resolve => setTimeout(resolve, 100));
  return new Promise((resolve, reject) => { const request = window.indexedDB.deleteDatabase('VibePPC'); request.onsuccess = () => resolve({ success: true }); request.onerror = () => reject(new Error('Database deletion failed')); request.onblocked = () => setTimeout(() => resolve({ success: true, blocked: true }), 2000); });
}

async function emergencyNuclearResetWithTimeout() {
  const TIMEOUT_MS = 5000;
  try { const resetPromise = nuclearResetNative(); const timeoutPromise = new Promise((_, reject) => { setTimeout(() => reject(new Error('Emergency reset timeout')), TIMEOUT_MS); }); await Promise.race([resetPromise, timeoutPromise]); localStorage.setItem('db_nuclear_reset', 'true'); await new Promise(resolve => setTimeout(resolve, 200)); window.location.reload(); return { success: true, nuclearReset: true }; }
  catch (error) { return { success: false, needsManualReset: true, error: error.message }; }
}

if (typeof window !== 'undefined') {
  window.clearAllLocalData = async () => { await nuclearResetNative(); localStorage.clear(); window.location.reload(); };
  window.clearDatabaseOnly = async () => { await nuclearResetNative(); window.location.reload(); };
}

// ============================================================
// EXPERT DATA PARSERS
// ============================================================

export function extractDate(obj) {
  if (!obj) return null;
  if (obj.date) return obj.date;
  if (obj.Date) return obj.Date;
  for (let key in obj) {
    let cleanKey = key.replace(/[^a-zA-Z]/g, '').toLowerCase();
    if (cleanKey === 'date' || cleanKey === 'startdate') {
      return obj[key];
    }
  }
  return null;
}

// ============================================================
// FIX 1: safeParseDate — har Amazon CSV format support karta hai
// Supported formats:
//   2024-01-15        (ISO)
//   01/15/2024        (US)
//   15/01/2024        (EU)
//   Jan 15, 2024      (Amazon default)
//   January 15, 2024  (full month)
//   Excel serial number (e.g. 45000)
// ============================================================
export function safeParseDate(dateVal) {
  if (!dateVal) return NaN;

  // Number: Excel serial ya timestamp
  if (typeof dateVal === 'number') {
    if (dateVal < 100000) return Math.round((dateVal - 25569) * 86400 * 1000);
    return dateVal;
  }

  // Date object
  if (typeof dateVal === 'object' && dateVal instanceof Date) {
    return dateVal.getTime();
  }

  let dStr = String(dateVal).trim();

  // Empty ya header row skip karo
  if (!dStr || dStr.toLowerCase() === 'date' || dStr.toLowerCase() === 'invalid date') return NaN;

  // Direct parse — ISO format (2024-01-15) aur "Jan 15, 2024" yahan kaam karta hai
  let parsed = new Date(dStr).getTime();
  if (!isNaN(parsed)) return parsed;

  // DD/MM/YYYY ya MM/DD/YYYY
  const slashParts = dStr.split('/');
  if (slashParts.length === 3) {
    // MM/DD/YYYY try karo
    parsed = new Date(`${slashParts[2]}-${slashParts[0].padStart(2,'0')}-${slashParts[1].padStart(2,'0')}`).getTime();
    if (!isNaN(parsed)) return parsed;
    // DD/MM/YYYY try karo
    parsed = new Date(`${slashParts[2]}-${slashParts[1].padStart(2,'0')}-${slashParts[0].padStart(2,'0')}`).getTime();
    if (!isNaN(parsed)) return parsed;
  }

  // DD-MM-YYYY ya MM-DD-YYYY (dash separated)
  const dashParts = dStr.split('-');
  if (dashParts.length === 3 && dashParts[0].length <= 2) {
    // DD-MM-YYYY try karo
    parsed = new Date(`${dashParts[2]}-${dashParts[1].padStart(2,'0')}-${dashParts[0].padStart(2,'0')}`).getTime();
    if (!isNaN(parsed)) return parsed;
  }

  // "Jan 15 2024" ya "15 Jan 2024" without comma
  parsed = new Date(dStr.replace(/(\d+)\s+([A-Za-z]+)\s+(\d{4})/, '$2 $1, $3')).getTime();
  if (!isNaN(parsed)) return parsed;

  return NaN;
}

// ============================================================
// FIX 2: safeParseFloat — $, %, commas sab handle karta hai
// ============================================================
export function safeParseFloat(val) {
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  if (!val) return 0;
  // $12,345.67 ya 18.6% ya "1,500" sab clean karo
  const cleaned = String(val).replace(/[^0-9.-]/g, '');
  const result = parseFloat(cleaned);
  return isNaN(result) ? 0 : result;
}

// ============================================================
// UTILITY: Get max date from uploaded data
// ============================================================
export async function getMaxDateFromData() {
  try {
    if (!db.isOpen()) await db.open();
    const allCampaigns = await db.campaigns.toArray();

    let maxDate = Date.now();
    let foundMax = 0;

    for (let i = 0; i < allCampaigns.length; i++) {
      let rawDate = extractDate(allCampaigns[i]);
      let t = safeParseDate(rawDate);
      if (t && !isNaN(t) && t > foundMax) {
        foundMax = t;
      }
    }

    if (foundMax > 0) maxDate = foundMax;
    return maxDate;
  } catch (error) {
    return Date.now();
  }
}

// ============================================================
// QUERIES
// ============================================================

export const queries = {

  async calculateTotalMetrics() {
    try {
      if (!db.isOpen()) await db.open();
      const campaigns = await db.campaigns.toArray();
      let totalSpend = 0, totalSales = 0, totalImpressions = 0, totalClicks = 0;

      campaigns.forEach(c => {
        if (!c.deleted) {
          totalSpend += safeParseFloat(c.spend);
          totalSales += safeParseFloat(c.sales);
          totalImpressions += safeParseFloat(c.impressions);
          totalClicks += safeParseFloat(c.clicks);
        }
      });

      return {
        totalSpend, totalSales, totalImpressions, totalClicks,
        roas: totalSpend > 0 ? totalSales / totalSpend : 0,
        acos: totalSales > 0 ? (totalSpend / totalSales) * 100 : 0
      };
    } catch (error) { return { totalSpend: 0, totalSales: 0, totalImpressions: 0, totalClicks: 0, roas: 0, acos: 0 }; }
  },

  async getCampaignsByDateRange(startDate, endDate) {
    try {
      if (!db.isOpen()) await db.open();
      const allCampaigns = await db.campaigns.toArray();

      console.log('🔍 [DB] getCampaignsByDateRange called:', {
        totalCampaigns: allCampaigns.length,
        startDate: startDate === 0 ? 'All Time' : new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString()
      });

      const filtered = allCampaigns.filter(c => {
        if (c?.deleted === true) return false;
        // startDate 0 matlab "All Time" — sab show karo
        if (!startDate || startDate === 0) return true;

        let rawDate = extractDate(c);
        let parsedTime = safeParseDate(rawDate);

        // If date can't be parsed, exclude from filtered queries
        if (isNaN(parsedTime)) return false;
        return parsedTime >= startDate && parsedTime <= endDate;
      });

      console.log('🔍 [DB] Filtered campaigns:', filtered.length);
      return filtered;
    } catch (error) {
      console.error('❌ [DB] getCampaignsByDateRange error:', error);
      return [];
    }
  },

  async getBleedingKeywords(minSpend = 10, minACoS = 20) {
    try {
      if (!db.isOpen()) await db.open();
      const campaigns = await db.campaigns.toArray();

      return campaigns.filter(c => {
        if (c?.deleted === true) return false;
        // FIX: safeParseFloat use karo — string comparison band karo
        const spend = safeParseFloat(c?.spend);
        const sales = safeParseFloat(c?.sales);
        let acos = safeParseFloat(c?.acos);
        // ACoS 0-1 range (decimal) ko percentage mein convert karo
        if (acos > 0 && acos <= 1) acos = acos * 100;

        const isHighAcos = acos >= minACoS;
        const isZeroSalesBleeding = (sales === 0 && spend >= minSpend);

        return spend >= minSpend && (isHighAcos || isZeroSalesBleeding);
      });
    } catch (error) { return []; }
  },

  async getTopCampaigns(limit = 10, startDate = null, endDate = null) {
    try {
      if (!db.isOpen()) await db.open();
      const campaigns = await db.campaigns.toArray();
      return campaigns
        .filter(c => {
          if (c?.deleted === true) return false;

          // If no date range specified, return all campaigns
          if (!startDate || startDate === 0) return true;

          // Filter by date range
          let rawDate = extractDate(c);
          let parsedTime = safeParseDate(rawDate);

          if (isNaN(parsedTime)) return false;
          return parsedTime >= startDate && parsedTime <= endDate;
        })
        .sort((a, b) => safeParseFloat(b?.spend) - safeParseFloat(a?.spend))
        .slice(0, limit);
    } catch (error) { return []; }
  }
};