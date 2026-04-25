// Query Health Check Utility - FIXED VERSION
// Fix: Compare date-filtered count vs date-filtered results (not total count)

import { db } from './db';

export async function queryWithHealthCheck(queryFn, queryName = 'Query', dateRange = null) {
  try {
    const results = await queryFn();

    if (results.length === 0 && dateRange?.startDate && dateRange?.endDate) {
      // FIXED: Use same date range for count — not total count
      const rangeCount = await db.campaigns
        .where('date')
        .between(dateRange.startDate, dateRange.endDate)
        .count();

      if (rangeCount > 0) {
        // Real mismatch detected — retry once
        if (db.isOpen()) db.close();
        await db.open();
        const retryResults = await queryFn();
        if (retryResults.length > 0) return retryResults;
      }
      // rangeCount === 0 = genuinely no data in range, not an error
    }

    return results;
  } catch (error) {
    console.error(`❌ ${queryName} failed:`, error);
    throw error;
  }
}

export function useCampaignCount(callback) {
  return 0;
}