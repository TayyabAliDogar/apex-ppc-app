// Atomic Writer - Rule 2.10.3: Atomic Write Verification (Count-Based Validation)
// Eliminates silent write failures through before/after count verification
import { db } from './db';
import { persistenceGuard } from './persistence-guard';

class AtomicWriter {
  constructor() {
    this.MAX_WRITE_RETRIES = 2;
  }

  /**
   * Write data with atomic verification
   * @param {Array} data - Array of campaign objects
   * @param {string} operationName - Name for logging
   * @returns {Promise<{success: boolean, written: number, failed: number, error?: string}>}
   */
  async writeWithVerification(data, operationName = 'Atomic Write') {
    if (!data || data.length === 0) {
      return { success: true, written: 0, failed: 0 };
    }

    for (let attempt = 0; attempt < this.MAX_WRITE_RETRIES; attempt++) {
      try {
        // Step 1: Get count BEFORE write
        const countBefore = await persistenceGuard.execute(
          async () => await db.campaigns.filter(c => !c.deleted).count(),
          `${operationName} - Count Before`
        );

        console.log(`📊 ${operationName}: Count before write = ${countBefore}`);

        // Step 2: Perform write
        await persistenceGuard.execute(
          async () => await db.campaigns.bulkAdd(data),
          `${operationName} - Write`
        );

        // Step 3: Get count AFTER write
        const countAfter = await persistenceGuard.execute(
          async () => await db.campaigns.filter(c => !c.deleted).count(),
          `${operationName} - Count After`
        );

        console.log(`📊 ${operationName}: Count after write = ${countAfter}`);

        // Step 4: Verify write succeeded
        const expectedIncrease = data.length;
        const actualIncrease = countAfter - countBefore;

        if (actualIncrease === expectedIncrease) {
          // SUCCESS - Write verified
          console.log(`✅ ${operationName}: Write verified (${actualIncrease} rows added)`);
          return { success: true, written: actualIncrease, failed: 0 };
        } else if (actualIncrease > 0 && actualIncrease < expectedIncrease) {
          // PARTIAL SUCCESS - Some rows written
          console.warn(`⚠️ ${operationName}: Partial write (${actualIncrease}/${expectedIncrease} rows added)`);
          return { success: false, written: actualIncrease, failed: expectedIncrease - actualIncrease };
        } else {
          // FAILURE - No rows written
          throw new Error(`Write verification failed: Expected +${expectedIncrease}, got +${actualIncrease}`);
        }

      } catch (error) {
        console.error(`❌ ${operationName}: Write failed (Attempt ${attempt + 1}/${this.MAX_WRITE_RETRIES})`, error);

        if (attempt < this.MAX_WRITE_RETRIES - 1) {
          // Retry after delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        // Max retries exceeded
        return { success: false, written: 0, failed: data.length, error: error.message };
      }
    }

    return { success: false, written: 0, failed: data.length, error: 'Max retries exceeded' };
  }
}

// Export singleton instance
export const atomicWriter = new AtomicWriter();
