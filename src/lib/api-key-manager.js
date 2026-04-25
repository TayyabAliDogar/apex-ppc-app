// API Key Manager - BYOK (Bring Your Own Key) Security Model
// Handles shared key rate limiting and user's personal API keys

class APIKeyManager {
  constructor() {
    try {
      this.STORAGE_KEY = 'vibeppc_api_key';
      this.SHARED_KEY = import.meta.env?.VITE_GEMINI_API_KEY || '';
      this.SHARED_KEY_LIMIT = 10; // 10 requests per hour for shared key
      this.SHARED_KEY_USAGE_KEY = 'vibeppc_shared_key_usage';
    } catch (error) {
      console.error('❌ APIKeyManager constructor failed:', error);
      this.STORAGE_KEY = 'vibeppc_api_key';
      this.SHARED_KEY = '';
      this.SHARED_KEY_LIMIT = 10;
      this.SHARED_KEY_USAGE_KEY = 'vibeppc_shared_key_usage';
    }
  }

  /**
   * Get active API key (user's key or shared key)
   */
  getActiveKey() {
    const userKey = this.getUserKey();
    if (userKey) {
      return userKey;
    }

    return this.SHARED_KEY;
  }

  /**
   * Check if using shared key
   */
  isUsingSharedKey() {
    return !this.getUserKey();
  }

  /**
   * Get user's personal API key from localStorage
   */
  getUserKey() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return null;

      const data = JSON.parse(stored);
      return data.key || null;
    } catch (error) {
      console.error('Failed to read user API key:', error);
      return null;
    }
  }

  /**
   * Save user's personal API key
   */
  saveUserKey(apiKey) {
    try {
      const data = {
        key: apiKey.trim(),
        savedAt: Date.now()
      };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save API key:', error);
      return false;
    }
  }

  /**
   * Remove user's personal API key
   */
  removeUserKey() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Check shared key rate limit (10 requests/hour)
   */
  canUseSharedKey() {
    if (!this.isUsingSharedKey()) {
      return true; // User has their own key, no limit
    }

    try {
      const stored = localStorage.getItem(this.SHARED_KEY_USAGE_KEY);
      if (!stored) return true;

      const usage = JSON.parse(stored);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);

      // Filter requests from last hour
      const recentRequests = usage.requests.filter(t => t > oneHourAgo);

      if (recentRequests.length >= this.SHARED_KEY_LIMIT) {
        const oldestRequest = Math.min(...recentRequests);
        const waitMinutes = Math.ceil((oldestRequest + 60 * 60 * 1000 - Date.now()) / 60000);

        console.warn(`⚠️ Shared key limit reached (${this.SHARED_KEY_LIMIT}/hour)`);
        return {
          allowed: false,
          waitMinutes,
          message: `Shared key limit reached (${this.SHARED_KEY_LIMIT}/hour). Wait ${waitMinutes} minutes or add your own key.`
        };
      }

      return true;
    } catch (error) {
      console.error('Failed to check shared key limit:', error);
      return true; // Allow on error
    }
  }

  /**
   * Record shared key usage
   */
  recordSharedKeyUsage() {
    if (!this.isUsingSharedKey()) return;

    try {
      const stored = localStorage.getItem(this.SHARED_KEY_USAGE_KEY);
      const usage = stored ? JSON.parse(stored) : { requests: [] };

      // Add current timestamp
      usage.requests.push(Date.now());

      // Keep only last hour
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      usage.requests = usage.requests.filter(t => t > oneHourAgo);

      localStorage.setItem(this.SHARED_KEY_USAGE_KEY, JSON.stringify(usage));

    } catch (error) {
      console.error('Failed to record shared key usage:', error);
    }
  }

  /**
   * Get remaining shared key quota
   */
  getSharedKeyQuota() {
    if (!this.isUsingSharedKey()) {
      return { unlimited: true };
    }

    try {
      const stored = localStorage.getItem(this.SHARED_KEY_USAGE_KEY);
      if (!stored) {
        return { remaining: this.SHARED_KEY_LIMIT, total: this.SHARED_KEY_LIMIT };
      }

      const usage = JSON.parse(stored);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);
      const recentRequests = usage.requests.filter(t => t > oneHourAgo);

      return {
        remaining: this.SHARED_KEY_LIMIT - recentRequests.length,
        total: this.SHARED_KEY_LIMIT,
        used: recentRequests.length
      };
    } catch (error) {
      return { remaining: this.SHARED_KEY_LIMIT, total: this.SHARED_KEY_LIMIT };
    }
  }

  /**
   * Validate API key format
   */
  validateKeyFormat(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return { valid: false, error: 'API key is required' };
    }

    const trimmed = apiKey.trim();

    if (trimmed.length < 20) {
      return { valid: false, error: 'API key is too short' };
    }

    if (!trimmed.startsWith('AIza')) {
      return { valid: false, error: 'Invalid Gemini API key format (should start with "AIza")' };
    }

    return { valid: true };
  }
}

export const apiKeyManager = new APIKeyManager();
