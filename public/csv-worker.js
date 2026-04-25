// CSV Worker for parsing Amazon bulk reports
// This runs in a separate thread to avoid blocking the UI

importScripts('https://cdn.jsdelivr.net/npm/papaparse@5/papaparse.min.js');

const MAX_MEMORY_MB = 200;
const CHUNK_SIZE = 2000; // Reduced for mobile compatibility
const WRITE_DELAY = 50; // Delay between chunks for GC

self.onmessage = async (e) => {
  const { file, chunkSize = CHUNK_SIZE } = e.data;

  let totalRows = 0;
  let processedRows = 0;
  let errors = [];

  Papa.parse(file, {
    worker: false, // Already in worker thread
    header: true,
    skipEmptyLines: true,
    chunk: async (results, parser) => {
      try {
        // Validate and transform rows
        const validRows = results.data
          .filter(row => validateRow(row))
          .map(row => transformRow(row));

        if (validRows.length > 0) {
          // Send chunk to main thread
          self.postMessage({
            type: 'chunk',
            data: validRows,
            progress: processedRows
          });

          processedRows += validRows.length;
        }

        // Collect errors
        if (results.errors.length > 0) {
          errors.push(...results.errors);
        }

        // Memory management - pause if needed
        if (self.performance?.memory) {
          const usedMB = self.performance.memory.usedJSHeapSize / (1024 * 1024);
          if (usedMB > MAX_MEMORY_MB) {
            parser.pause();
            self.postMessage({
              type: 'pause',
              reason: 'memory',
              usedMB: Math.round(usedMB)
            });

            // Wait for GC
            await new Promise(resolve => setTimeout(resolve, 500));
            parser.resume();
          }
        }

        // Small delay for GC
        await new Promise(resolve => setTimeout(resolve, WRITE_DELAY));

      } catch (error) {
        self.postMessage({
          type: 'error',
          error: error.message
        });
        parser.abort();
      }
    },
    complete: () => {
      self.postMessage({
        type: 'complete',
        totalRows: processedRows,
        errors: errors.slice(0, 10) // Only send first 10 errors
      });
    },
    error: (error) => {
      self.postMessage({
        type: 'error',
        error: error.message
      });
    }
  });
};

// Validate row has required fields
function validateRow(row) {
  // Flexible field mapping for Amazon bulk reports
  const campaignNameFields = ['Campaign Name', 'Campaign', 'Campaign name'];
  const spendFields = ['Spend', 'Cost', 'Total Spend', 'Ad Spend'];
  const salesFields = ['Sales', '7 Day Total Sales', 'Attributed Sales 7d', 'Total Sales'];

  // Check if row has Campaign Name
  const hasCampaignName = campaignNameFields.some(field =>
    row[field] && row[field].trim() !== ''
  );

  // Check if row has Spend OR Sales
  const hasSpend = spendFields.some(field =>
    row[field] && row[field].trim() !== ''
  );

  const hasSales = salesFields.some(field =>
    row[field] && row[field].trim() !== ''
  );

  return hasCampaignName && (hasSpend || hasSales);
}

// Get field value with flexible mapping
function getFieldValue(row, possibleFields) {
  for (const field of possibleFields) {
    if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
      return row[field];
    }
  }
  return null;
}

// Transform Amazon CSV row to our schema
function transformRow(row) {
  // Field mappings for Amazon bulk reports
  const MAPPINGS = {
    campaignName: ['Campaign Name', 'Campaign', 'Campaign name'],
    asin: ['ASIN', 'Advertised ASIN', 'Product ASIN', 'SKU'],
    date: ['Date', 'Start Date', 'Day', 'Report Date'],
    impressions: ['Impressions', 'Impr.'],
    clicks: ['Clicks'],
    spend: ['Spend', 'Cost', 'Total Spend', 'Ad Spend'],
    sales: ['Sales', '7 Day Total Sales', 'Attributed Sales 7d', 'Total Sales'],
    orders: ['Orders', '7 Day Total Orders', 'Attributed Orders 7d', 'Total Orders'],
    acos: ['ACoS', 'ACOS', 'Advertising Cost of Sales'],
    roas: ['ROAS', 'Return on Ad Spend'],
    ctr: ['CTR', 'Click-Through Rate', 'Click-through Rate'],
    cpc: ['CPC', 'Cost Per Click', 'Avg. CPC']
  };

  return {
    campaignName: getFieldValue(row, MAPPINGS.campaignName) || '',
    asin: getFieldValue(row, MAPPINGS.asin) || '',
    date: parseDate(getFieldValue(row, MAPPINGS.date)),
    impressions: parseInt(getFieldValue(row, MAPPINGS.impressions) || 0),
    clicks: parseInt(getFieldValue(row, MAPPINGS.clicks) || 0),
    spend: parseFloat(getFieldValue(row, MAPPINGS.spend) || 0),
    sales: parseFloat(getFieldValue(row, MAPPINGS.sales) || 0),
    orders: parseInt(getFieldValue(row, MAPPINGS.orders) || 0),
    acos: parseFloat(getFieldValue(row, MAPPINGS.acos) || 0),
    roas: parseFloat(getFieldValue(row, MAPPINGS.roas) || 0),
    ctr: parseFloat(getFieldValue(row, MAPPINGS.ctr) || 0),
    cpc: parseFloat(getFieldValue(row, MAPPINGS.cpc) || 0),
    conversionRate: parseFloat(getFieldValue(row, ['Conversion Rate']) || 0)
  };
}

// Parse various date formats
function parseDate(dateStr) {
  if (!dateStr) return Date.now();

  // Try ISO format first
  const isoDate = new Date(dateStr);
  if (!isNaN(isoDate.getTime())) {
    return isoDate.getTime();
  }

  // Try MM/DD/YYYY format
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const [month, day, year] = parts;
    const date = new Date(year, month - 1, day);
    if (!isNaN(date.getTime())) {
      return date.getTime();
    }
  }

  return Date.now();
}
