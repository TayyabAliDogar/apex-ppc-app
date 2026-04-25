// Backup Manager - Hybrid Backup Strategy
// Emergency localStorage backup + Weekly export reminders

import { db } from './db';
import LZString from 'lz-string';

class BackupManager {
  constructor() {
    try {
      this.EMERGENCY_KEY = 'vibeppc_emergency_backup';
      this.LAST_BACKUP_KEY = 'vibeppc_last_backup_timestamp';
      this.LAST_MANUAL_BACKUP_KEY = 'vibeppc_last_manual_backup';
      this.MAX_EMERGENCY_SIZE = 5 * 1024 * 1024; // 5MB localStorage limit
    } catch (error) {
      console.error('❌ BackupManager constructor failed:', error);
      this.EMERGENCY_KEY = 'vibeppc_emergency_backup';
      this.LAST_BACKUP_KEY = 'vibeppc_last_backup_timestamp';
      this.LAST_MANUAL_BACKUP_KEY = 'vibeppc_last_manual_backup';
      this.MAX_EMERGENCY_SIZE = 5 * 1024 * 1024;
    }
  }

  /**
   * Create emergency backup in localStorage (auto-triggered)
   */
  async createEmergencyBackup() {
    try {
      // Get critical data (Active listings + Recent campaigns)
      const listings = await db.aiCache.toArray();

      // Rule 2.14.3: Query Safety - Use .filter() for unindexed field (createdAt)
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const recentCampaigns = await db.campaigns
        .toArray()
        .then(campaigns => campaigns.filter(c =>
          !c.deleted && c.createdAt > sevenDaysAgo
        ));

      const backup = {
        version: 1,
        timestamp: Date.now(),
        listings,
        campaigns: recentCampaigns,
        rowCount: listings.length + recentCampaigns.length
      };

      // Compress and store
      const json = JSON.stringify(backup);
      const compressed = LZString.compress(json);

      // Check size
      if (compressed.length > this.MAX_EMERGENCY_SIZE) {
        console.warn('⚠️ Emergency backup too large, storing recent data only');
        // Store only last 3 days if too large
        // Rule 2.14.3: Query Safety - Use .filter() for unindexed field (createdAt)
        const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
        const veryRecentCampaigns = await db.campaigns
          .toArray()
          .then(campaigns => campaigns.filter(c =>
            !c.deleted && c.createdAt > threeDaysAgo
          ));

        backup.campaigns = veryRecentCampaigns;
        backup.rowCount = listings.length + veryRecentCampaigns.length;
      }

      const finalCompressed = LZString.compress(JSON.stringify(backup));
      localStorage.setItem(this.EMERGENCY_KEY, finalCompressed);
      localStorage.setItem(this.LAST_BACKUP_KEY, Date.now().toString());

      return true;
    } catch (error) {
      console.error('❌ Emergency backup failed:', error);
      return false;
    }
  }

  /**
   * Restore from emergency backup
   */
  async restoreEmergencyBackup() {
    try {
      const compressed = localStorage.getItem(this.EMERGENCY_KEY);
      if (!compressed) {
        return null;
      }

      const json = LZString.decompress(compressed);
      const backup = JSON.parse(json);

      // Restore to IndexedDB
      if (backup.listings && backup.listings.length > 0) {
        await db.aiCache.bulkPut(backup.listings);
      }

      if (backup.campaigns && backup.campaigns.length > 0) {
        await db.campaigns.bulkPut(backup.campaigns);
      }

      return backup;
    } catch (error) {
      console.error('❌ Emergency restore failed:', error);
      return null;
    }
  }

  /**
   * Check if weekly backup reminder is needed
   */
  needsWeeklyReminder() {
    try {
      const lastBackup = localStorage.getItem(this.LAST_MANUAL_BACKUP_KEY);
      if (!lastBackup) return true;

      const daysSince = (Date.now() - parseInt(lastBackup)) / (24 * 60 * 60 * 1000);
      return daysSince >= 7;
    } catch (error) {
      return true;
    }
  }

  /**
   * Export all data to JSON file (one-click export)
   */
  async exportAllData() {
    try {
      // Rule 2.9.2: Use .filter() for soft-delete check (Schema V3)
      const data = {
        version: 1,
        exportDate: new Date().toISOString(),
        campaigns: await db.campaigns.filter(c => !c.deleted).toArray(),
        keywords: await db.keywords.toArray(),
        insights: await db.insights.toArray(),
        aiCache: await db.aiCache.toArray(),
        settings: await db.settings.toArray()
      };

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibeppc-backup-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update last manual backup timestamp
      localStorage.setItem(this.LAST_MANUAL_BACKUP_KEY, Date.now().toString());

      return true;
    } catch (error) {
      console.error('❌ Export failed:', error);
      return false;
    }
  }

  /**
   * Import data from JSON file
   */
  async importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate format
      if (!data.version || !data.campaigns) {
        throw new Error('Invalid backup file format');
      }

      // Import data
      if (data.campaigns && data.campaigns.length > 0) {
        await db.campaigns.bulkPut(data.campaigns);
      }

      if (data.keywords && data.keywords.length > 0) {
        await db.keywords.bulkPut(data.keywords);
      }

      if (data.insights && data.insights.length > 0) {
        await db.insights.bulkPut(data.insights);
      }

      if (data.aiCache && data.aiCache.length > 0) {
        await db.aiCache.bulkPut(data.aiCache);
      }

      if (data.settings && data.settings.length > 0) {
        await db.settings.bulkPut(data.settings);
      }

      return {
        success: true,
        campaigns: data.campaigns?.length || 0,
        keywords: data.keywords?.length || 0
      };
    } catch (error) {
      console.error('❌ Import failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get backup status
   */
  getBackupStatus() {
    const lastBackup = localStorage.getItem(this.LAST_BACKUP_KEY);
    const lastManualBackup = localStorage.getItem(this.LAST_MANUAL_BACKUP_KEY);

    return {
      hasEmergencyBackup: !!localStorage.getItem(this.EMERGENCY_KEY),
      lastEmergencyBackup: lastBackup ? new Date(parseInt(lastBackup)) : null,
      lastManualBackup: lastManualBackup ? new Date(parseInt(lastManualBackup)) : null,
      needsWeeklyReminder: this.needsWeeklyReminder()
    };
  }
}

export const backupManager = new BackupManager();
