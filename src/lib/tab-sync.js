// Tab Synchronization Manager - Real-Time Multi-Tab Sync
// Uses BroadcastChannel API for instant cross-tab communication

class TabSyncManager {
  constructor() {
    try {
      this.channel = null;
      this.listeners = new Map();
      this.tabId = this.generateTabId();

      // Initialize BroadcastChannel if supported
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel('vibeppc_sync');
        this.channel.onmessage = (event) => this.handleMessage(event.data);
      } else {
        console.warn('⚠️ BroadcastChannel not supported - tabs will not sync');
      }
    } catch (error) {
      console.error('❌ TabSyncManager constructor failed:', error);
      this.channel = null;
      this.listeners = new Map();
      this.tabId = 'fallback_' + Date.now();
    }
  }

  /**
   * Generate unique tab ID
   */
  generateTabId() {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Broadcast message to all other tabs
   */
   broadcast(type, payload = {}) {
    if (!this.channel) return;
    const message = {
      type,
      payload,
      tabId: this.tabId
    };

    try {
      this.channel.postMessage(message);
    } catch (error) {
      // Silently ignore the closed channel error to keep console clean
      if (error.name !== 'InvalidStateError') {
        console.warn('Tab sync warning:', error);
      }
    }
  }

  /**
   * Handle incoming messages from other tabs
   */
  handleMessage(message) {
    // Ignore our own messages
    if (message.tabId === this.tabId) return;

    const { type, payload } = message;

    // Trigger registered listeners
    const listeners = this.listeners.get(type) || [];
    listeners.forEach(callback => {
      try {
        callback(payload);
      } catch (error) {
        console.error(`Listener error for ${type}:`, error);
      }
    });
  }

  /**
   * Subscribe to specific sync events
   */
  subscribe(type, callback) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(callback);
  }

  /**
   * Unsubscribe from sync events
   */
  unsubscribe(type, callback) {
    if (!this.listeners.has(type)) return;

    const listeners = this.listeners.get(type);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  /**
   * Close channel (cleanup)
   */
  close() {
    if (this.channel) {
      this.channel.close();
    }
  }

  /**
   * Check if tab sync is available
   */
  isAvailable() {
    return this.channel !== null;
  }
}

// Singleton instance
export const tabSync = new TabSyncManager();

// Sync event types
export const SYNC_EVENTS = {
  DATA_UPDATED: 'DATA_UPDATED',
  LISTING_EDITED: 'LISTING_EDITED',
  SETTINGS_CHANGED: 'SETTINGS_CHANGED',
  BACKUP_CREATED: 'BACKUP_CREATED',
  CAMPAIGNS_UPLOADED: 'CAMPAIGNS_UPLOADED'
};
