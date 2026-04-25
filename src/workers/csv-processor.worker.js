// CSV Processor Web Worker - Performance Engine
// Rule 2.4: UI-Worker Isolation Protocol (NO React, NO UI dependencies)
// Rule 2.6: Agentic Header Mapping (Fuzzy matching for marketplace variations)

import Papa from 'papaparse';

// Rule 2.6: Agentic Header Mapping System
const HEADER_MAPPINGS = {
  campaignName: [
    'campaign name',
    'campaign',
    'campaignname',
    'campaign_name',
    'ad group',
    'adgroup',
    'ad group name'
  ],
  spend: [
    'spend',
    'cost',
    'total spend',
    'total cost',
    'ad spend',
    'advertising cost',
    'amount spent'
  ],
  sales: [
    'sales',
    'revenue',
    'total sales',
    'attributed sales',
    'attributed revenue',
    '7 day total sales',
    '14 day total sales',
    '7day total sales'
  ],
  impressions: [
    'impressions',
    'impr',
    'impression',
    'total impressions'
  ],
  clicks: [
    'clicks',
    'click',
    'total clicks'
  ],
  asin: [
    'asin',
    'advertised asin',
    'promoted asin',
    'product asin'
  ],
  date: [
    'date',
    'day',
    'report date',
    'start date'
  ]
};

// Marketplace format detection
const MARKETPLACE_FORMATS = {
  US: { currency: '$', dateFormat: 'MM/DD/YYYY', name: 'United States' },
  UK: { currency: '£', dateFormat: 'DD/MM/YYYY', name: 'United Kingdom' },
  CA: { currency: 'CAD', dateFormat: 'YYYY-MM-DD', name: 'Canada' },
  DE: { currency: '€', dateFormat: 'DD.MM.YYYY', name: 'Germany' },
  FR: { currency: '€', dateFormat: 'DD/MM/YYYY', name: 'France' },
  UAE: { currency: 'AED', dateFormat: 'DD/MM/YYYY', name: 'UAE' },
  SA: { currency: 'SAR', dateFormat: 'DD/MM/YYYY', name: 'Saudi Arabia' },
  JP: { currency: '¥', dateFormat: 'YYYY/MM/DD', name: 'Japan' },
  AU: { currency: 'AUD', dateFormat: 'DD/MM/YYYY', name: 'Australia' }
};

/**
 * Levenshtein distance for typo tolerance
 */
function levenshteinDistance(a, b) {
  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Fuzzy matching function (Rule 2.6)
 */
function fuzzyMatch(header, candidates) {
  const normalized = header.toLowerCase().trim();

  // CRITICAL FIX: Exclude known metric columns that should NOT be matched to spend/sales
  const excludedMetrics = ['acos', 'roas', 'ctr', 'cpc', 'cvr'];
  if (excludedMetrics.includes(normalized)) {
    return false;
  }

  // Exact match first
  if (candidates.includes(normalized)) {
    return true;
  }

  // Partial match (contains)
  for (const candidate of candidates) {
    if (normalized.includes(candidate) || candidate.includes(normalized)) {
      return true;
    }
  }

  // Levenshtein distance for typos (max 1 edit for stricter matching)
  for (const candidate of candidates) {
    if (levenshteinDistance(normalized, candidate) <= 1) {
      return true;
    }
  }

  return false;
}

/**
 * Map CSV headers to internal schema (Rule 2.6)
 */
function mapHeaders(csvHeaders) {
  const mapping = {};
  const unmapped = [];

  for (const csvHeader of csvHeaders) {
    let mapped = false;

    for (const [internalField, candidates] of Object.entries(HEADER_MAPPINGS)) {
      if (fuzzyMatch(csvHeader, candidates)) {
        mapping[internalField] = csvHeader;
        mapped = true;
        break;
      }
    }

    if (!mapped) {
      unmapped.push(csvHeader);
    }
  }

  // Validate required fields
  const required = ['campaignName', 'spend', 'sales'];
  const missing = required.filter(field => !mapping[field]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required columns: ${missing.join(', ')}.\n` +
      `Unmapped headers: ${unmapped.join(', ')}.\n` +
      `Please ensure your CSV contains campaign name, spend, and sales data.`
    );
  }

  // PHASE 1 FIX: Log successful mapping for debugging
  console.log('✅ Worker: Header mapping successful:', mapping);
  console.log('📋 Worker: CSV Headers found:', csvHeaders);
  console.log('💰 Worker: Spend column mapped to:', mapping.spend, '(CSV header)');
  console.log('💵 Worker: Sales column mapped to:', mapping.sales, '(CSV header)');
  console.log('📊 Worker: Full mapping object:', JSON.stringify(mapping, null, 2));
  if (unmapped.length > 0) {
    console.log('ℹ️ Worker: Unmapped headers (will be ignored):', unmapped);
  }

  return mapping;
}

/**
 * Detect marketplace from CSV data
 */
function detectMarketplace(rows, headerMapping) {
  if (!rows || rows.length === 0) return { marketplace: 'US', confidence: 'low' };

  const sample = rows.slice(0, Math.min(10, rows.length));
  const currencyPattern = /[£€¥]|CAD|AED|SAR|AUD/;
  let detectedCurrency = '$';

  for (const row of sample) {
    const spendValue = row[headerMapping.spend] || '';
    const salesValue = row[headerMapping.sales] || '';

    const match = (spendValue + salesValue).match(currencyPattern);
    if (match) {
      detectedCurrency = match[0];
      break;
    }
  }

  for (const [code, format] of Object.entries(MARKETPLACE_FORMATS)) {
    if (format.currency === detectedCurrency) {
      return { marketplace: code, confidence: 'high', currency: detectedCurrency };
    }
  }

  return { marketplace: 'US', confidence: 'low', reason: 'default' };
}

/**
 * Rule 2.13: Strict type casting for all CSV values
 * Converts to string and trims whitespace
 */
function castToString(value) {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
}

/**
 * Rule 2.13.2: Enforce string/number types only
 * Converts all values to safe types for IndexedDB
 */
function enforceKeyType(value, fieldName) {
  // Numbers: preserve as-is (unless NaN)
  if (typeof value === 'number') {
    return Number.isNaN(value) ? 0 : value;
  }

  // Strings: trim and return
  if (typeof value === 'string') {
    return value.trim();
  }

  // Booleans: convert to string
  if (typeof value === 'boolean') {
    return String(value);
  }

  // null, undefined, objects, arrays: convert to empty string
  if (value === null || value === undefined || typeof value === 'object') {
    if (fieldName) {
      console.warn(`⚠️ Worker: Converted ${fieldName} from ${typeof value} to empty string`);
    }
    return '';
  }

  // Fallback: convert to string
  return String(value);
}

/**
 * Rule 2.13.2: Apply type enforcement to entire row
 */
function enforceRowTypes(row) {
  const enforced = {};

  for (const [key, value] of Object.entries(row)) {
    enforced[key] = enforceKeyType(value, key);
  }

  return enforced;
}

/**
 * Rule 2.12.3: Sanitize individual value (No Nulls Policy)
 * Converts null, undefined, NaN to empty string ""
 */
function sanitizeValue(value) {
  // Convert null, undefined, NaN to empty string
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '';
  }

  // Numbers are preserved as-is
  if (typeof value === 'number') {
    return value;
  }

  // Booleans are preserved as-is
  if (typeof value === 'boolean') {
    return value;
  }

  // Strings are trimmed
  if (typeof value === 'string') {
    return value.trim();
  }

  // Fallback: convert to string
  return String(value);
}

/**
 * Rule 2.12.3: Sanitize entire row object (No Nulls Policy)
 * Applies sanitization to every field before database write
 */
function sanitizeRow(row) {
  const sanitized = {};

  for (const [key, value] of Object.entries(row)) {
    sanitized[key] = sanitizeValue(value);
  }

  return sanitized;
}

/**
 * Transform CSV row using header mapping (Rule 2.6)
 * Includes Rule 2.8: Data Sanitization (The Entry Guard)
 * Includes Rule 2.10.1: Identity Mandate (NO 'id' field - auto-increment only)
 */
function transformRow(row, headerMapping, marketplace) {
  // Rule 2.8.1: Null-String Prevention - Sanitize all indexed string fields
  const sanitizeString = (value, defaultValue = 'Unknown') => {
    if (!value || typeof value !== 'string' || value.trim() === '') {
      return defaultValue;
    }
    return value.trim();
  };

  const cleanCurrency = (value) => {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/[^0-9.-]/g, '')) || 0;
  };

  const parseDate = (dateStr) => {
    if (!dateStr) {
      console.log('⚠️ Worker: Empty date string, using Date.now()');
      return Date.now();
    }

    // DEBUG: Log raw date value
    if (Math.random() < 0.1) { // Log 10% of dates
      console.log('🔍 Worker: Parsing date:', dateStr, 'Type:', typeof dateStr);
    }

    // Try YYYY-MM-DD format first (ISO format, most common in CSVs)
    if (dateStr.includes('-') && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      const timestamp = new Date(dateStr).getTime();
      if (!isNaN(timestamp)) {
        if (Math.random() < 0.1) {
          console.log('✅ Worker: Date parsed successfully:', dateStr, '→', timestamp);
        }
        return timestamp;
      }
    }

    // Try marketplace-specific format
    const format = MARKETPLACE_FORMATS[marketplace].dateFormat;

    if (format === 'MM/DD/YYYY' && dateStr.includes('/')) {
      const [month, day, year] = dateStr.split('/');
      return new Date(year, month - 1, day).getTime();
    } else if (format === 'DD/MM/YYYY' && dateStr.includes('/')) {
      const [day, month, year] = dateStr.split('/');
      return new Date(year, month - 1, day).getTime();
    } else if (format === 'DD.MM.YYYY' && dateStr.includes('.')) {
      const [day, month, year] = dateStr.split('.');
      return new Date(year, month - 1, day).getTime();
    } else if (format === 'YYYY/MM/DD' && dateStr.includes('/')) {
      return new Date(dateStr.replace(/\//g, '-')).getTime();
    }

    // Fallback: try direct parse
    const timestamp = new Date(dateStr).getTime();
    return isNaN(timestamp) ? Date.now() : timestamp;
  };

  const impressions = parseInt(row[headerMapping.impressions]) || 0;
  const clicks = parseInt(row[headerMapping.clicks]) || 0;

  // DEBUG: Log raw CSV values for first 3 rows
  const rawSpendValue = row[headerMapping.spend];
  const rawSalesValue = row[headerMapping.sales];
  if (Math.random() < 0.05) { // Log ~5% of rows to avoid spam
    console.log('🔍 Worker: Raw CSV values:', {
      campaignName: row[headerMapping.campaignName],
      rawSpend: rawSpendValue,
      rawSales: rawSalesValue,
      spendHeader: headerMapping.spend,
      salesHeader: headerMapping.sales
    });
  }

  const spend = cleanCurrency(rawSpendValue);
  const sales = cleanCurrency(rawSalesValue);

  const acos = sales > 0 ? (spend / sales) * 100 : 0;
  const roas = spend > 0 ? sales / spend : 0;

  // Rule 2.10.1: CRITICAL - NO 'id' field in returned object
  // Dexie will auto-generate id during bulkAdd() using ++id schema
  return {
    // Rule 2.8.1: Sanitize all indexed string fields to prevent empty strings
    campaignName: sanitizeString(row[headerMapping.campaignName], 'Unknown_Campaign'),
    asin: sanitizeString(row[headerMapping.asin], ''), // Empty string OK for non-indexed field
    date: headerMapping.date ? parseDate(row[headerMapping.date]) : Date.now(),
    impressions,
    clicks,
    spend,
    sales,
    acos,
    roas,
    marketplace,
    createdAt: Date.now(),
    deleted: false
    // NO 'id' FIELD - Let Dexie auto-increment (Rule 2.10.1)
  };
}

/**
 * Process CSV file in chunks (Rule 2.1: Web Worker Processing)
 */
self.onmessage = async (e) => {
  const { file, chunkSize = 1000 } = e.data;

  try {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data;
          const totalRows = rows.length;

          if (totalRows === 0) {
            throw new Error('CSV file is empty or has no valid data rows');
          }

          // Rule 2.6: Map headers using fuzzy matching
          const csvHeaders = Object.keys(rows[0]);
          const headerMapping = mapHeaders(csvHeaders);

          // Detect marketplace
          const detection = detectMarketplace(rows, headerMapping);

          self.postMessage({
            type: 'MARKETPLACE_DETECTED',
            marketplace: detection.marketplace,
            confidence: detection.confidence,
            name: MARKETPLACE_FORMATS[detection.marketplace].name
          });

          // Process in chunks of 1000 rows (Rule 2.2)
          let processedCount = 0;
          let skippedCount = 0;

          for (let i = 0; i < totalRows; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);

            // Transform rows using mapped headers
            const campaigns = [];
            for (const row of chunk) {
              try {
                const campaign = transformRow(row, headerMapping, detection.marketplace);

                // Rule 2.12.3: Sanitize row to remove null/undefined/NaN values
                const sanitizedCampaign = sanitizeRow(campaign);

                // Rule 2.13.2: Enforce string/number types only
                const typeEnforcedCampaign = enforceRowTypes(sanitizedCampaign);

                // PHASE 1 FIX: Correct string comparison + validate data quality
                const isValidCampaign =
                  typeEnforcedCampaign.campaignName !== 'Unknown_Campaign' && // Fix: Match actual default value
                  (typeEnforcedCampaign.spend > 0 || typeEnforcedCampaign.sales > 0 || typeEnforcedCampaign.impressions > 0); // Reject all-zero rows

                if (isValidCampaign) {
                  campaigns.push(typeEnforcedCampaign);
                } else {
                  skippedCount++;
                  if (typeEnforcedCampaign.campaignName === 'Unknown_Campaign') {
                    console.warn('⚠️ Worker: Skipped row with missing campaign name');
                  } else {
                    console.warn('⚠️ Worker: Skipped row with no data (all zeros)');
                  }
                }
              } catch (error) {
                console.warn('⚠️ Worker: Skipped invalid row:', error.message);
                skippedCount++;
              }
            }

            // PHASE 1 FIX: Log empty chunks
            if (campaigns.length === 0) {
              console.warn(`⚠️ Worker: Chunk ${Math.floor(i / chunkSize)} produced 0 valid campaigns (${chunk.length} rows skipped)`);
            }

            // Send chunk to main thread
            self.postMessage({
              type: 'CHUNK',
              data: campaigns,
              progress: {
                processed: Math.min(i + chunkSize, totalRows),
                total: totalRows,
                percentage: Math.round((Math.min(i + chunkSize, totalRows) / totalRows) * 100)
              }
            });

            processedCount += campaigns.length;

            // Yield to prevent worker from blocking
            await new Promise(resolve => setTimeout(resolve, 10));
          }

          // Send completion message
          self.postMessage({
            type: 'COMPLETE',
            totalProcessed: processedCount,
            totalRows,
            skipped: skippedCount,
            marketplace: detection.marketplace
          });

          // PHASE 1 FIX: Log final statistics
          console.log('✅ Worker: Processing complete');
          console.log(`📊 Statistics: ${processedCount} processed, ${skippedCount} skipped, ${totalRows} total`);
          console.log(`🌍 Marketplace: ${MARKETPLACE_FORMATS[detection.marketplace].name}`);

        } catch (error) {
          console.error('❌ Worker: Processing error:', error);
          self.postMessage({
            type: 'ERROR',
            error: error.message
          });
        }
      },
      error: (error) => {
        console.error('❌ Worker: Parse error:', error);
        self.postMessage({
          type: 'ERROR',
          error: `Failed to parse CSV: ${error.message}`
        });
      }
    });
  } catch (error) {
    console.error('❌ Worker: Fatal error:', error);
    self.postMessage({
      type: 'ERROR',
      error: error.message
    });
  }
};
