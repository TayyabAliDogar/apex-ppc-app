// Persistence Guard - Rule 2.10.2: Connection Persistence (3-Tier Retry Logic)
// Eliminates DatabaseClosedError through automatic connection recovery
import { db } from './db';

class PersistenceGuard {
  constructor() {
    this.MAX_RETRIES = 3;
    this.RETRY_DELAYS = [100, 500, 2000]; // Exponential backoff: 100ms, 500ms, 2s
  }

  /**
   * Execute database operation with connection persistence
   * @param {Function} operation - Async function that performs DB operation
   * @param {string} operationName - Name for logging
   * @returns {Promise} - Result of operation
   */
  async execute(operation, operationName = 'DB Operation') {
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        // Tier 1: Check if database is open
        if (!db.isOpen()) {
          console.warn(`⚠️ ${operationName}: Database closed, reopening... (Attempt ${attempt + 1}/${this.MAX_RETRIES})`);
          await db.open();
        }

        // Tier 2: Execute operation
        const result = await operation();

        // Success - return result
        if (attempt > 0) {
          console.log(`✅ ${operationName}: Succeeded after ${attempt + 1} attempts`);
        }
        return result;

      } catch (error) {
        const isDatabaseClosed =
          error.name === 'DatabaseClosedError' ||
          error.message.includes('database connection is closing') ||
          error.message.includes('database is closed');

        if (isDatabaseClosed && attempt < this.MAX_RETRIES - 1) {
          // Tier 3: Retry with exponential backoff
          const delay = this.RETRY_DELAYS[attempt];
          console.warn(`⚠️ ${operationName}: DatabaseClosedError, retrying in ${delay}ms... (Attempt ${attempt + 1}/${this.MAX_RETRIES})`);

          // Close and reopen connection
          try {
            db.close();
          } catch (closeError) {
            // Ignore close errors
          }

          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Retry
        }

        // Non-recoverable error or max retries exceeded
        console.error(`❌ ${operationName}: Failed after ${attempt + 1} attempts`, error);
        throw error;
      }
    }

    throw new Error(`${operationName}: Max retries (${this.MAX_RETRIES}) exceeded`);
  }
}

// Export singleton instance
export const persistenceGuard = new PersistenceGuard();
