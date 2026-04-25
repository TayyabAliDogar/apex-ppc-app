// Clear Local Data Utility
// Resolves IndexedDB conflicts and resets application state

import { db } from './db';

/**
 * Clear all local data (IndexedDB + localStorage)
 * Use this to resolve database conflicts or reset the app
 */
export async function clearAllLocalData() {
  try {
    console.log('🗑️ Clearing all local data...');

    // Close database connection
    db.close();

    // Delete IndexedDB database
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase('VibePPC');
      request.onsuccess = () => {
        console.log('✅ IndexedDB deleted successfully');
        resolve();
      };
      request.onerror = () => {
        console.error('❌ Failed to delete IndexedDB');
        reject(request.error);
      };
      request.onblocked = () => {
        console.warn('⚠️ IndexedDB deletion blocked - close all tabs');
        reject(new Error('Database deletion blocked'));
      };
    });

    // Clear localStorage
    localStorage.clear();
    console.log('✅ localStorage cleared');

    // Clear sessionStorage
    sessionStorage.clear();
    console.log('✅ sessionStorage cleared');

    console.log('✅ All local data cleared successfully');
    console.log('🔄 Reload the page to reinitialize the database');

    return {
      success: true,
      message: 'All local data cleared. Please reload the page.'
    };
  } catch (error) {
    console.error('❌ Error clearing local data:', error);
    return {
      success: false,
      message: `Failed to clear data: ${error.message}`
    };
  }
}

/**
 * Clear only IndexedDB (preserve localStorage settings)
 */
export async function clearDatabaseOnly() {
  try {
    console.log('🗑️ Clearing IndexedDB only...');

    // Close database connection
    db.close();

    // Delete IndexedDB database
    await new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase('VibePPC');
      request.onsuccess = () => {
        console.log('✅ IndexedDB deleted successfully');
        resolve();
      };
      request.onerror = () => {
        console.error('❌ Failed to delete IndexedDB');
        reject(request.error);
      };
      request.onblocked = () => {
        console.warn('⚠️ IndexedDB deletion blocked - close all tabs');
        reject(new Error('Database deletion blocked'));
      };
    });

    console.log('✅ Database cleared successfully');
    console.log('🔄 Reload the page to reinitialize the database');

    return {
      success: true,
      message: 'Database cleared. Please reload the page.'
    };
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    return {
      success: false,
      message: `Failed to clear database: ${error.message}`
    };
  }
}

// Expose to window for console access
if (typeof window !== 'undefined') {
  window.clearAllLocalData = clearAllLocalData;
  window.clearDatabaseOnly = clearDatabaseOnly;
  console.log('💡 Debug utilities available:');
  console.log('   - window.clearAllLocalData() - Clear everything');
  console.log('   - window.clearDatabaseOnly() - Clear database only');
}
