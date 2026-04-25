// AI Quota Management (Gemini Free Tier)
// Mandatory Mitigation: Enforce 15 RPM, 1500 RPD limits

class AIQuotaManager {
  constructor() {
    try {
      this.minuteRequests = [];
      this.dailyCount = parseInt(localStorage.getItem('ai_daily_count') || '0');
      this.lastResetDate = localStorage.getItem('ai_last_reset') || new Date().toDateString();

      // Check if we need to reset daily counter
      this.checkDailyReset();
    } catch (error) {
      console.error('❌ AIQuotaManager constructor failed:', error);
      // Fallback to in-memory only
      this.minuteRequests = [];
      this.dailyCount = 0;
      this.lastResetDate = new Date().toDateString();
    }
  }

  checkDailyReset() {
    const today = new Date().toDateString();
    if (today !== this.lastResetDate) {
      this.dailyCount = 0;
      this.lastResetDate = today;
      localStorage.setItem('ai_daily_count', '0');
      localStorage.setItem('ai_last_reset', today);
    }
  }

  async checkLimit() {
    this.checkDailyReset();

    // Check daily limit (1500 RPD)
    if (this.dailyCount >= 1500) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const hoursUntilReset = Math.ceil((tomorrow - Date.now()) / (1000 * 60 * 60));

      throw new Error(
        `Daily AI limit reached (1500 requests). Resets in ${hoursUntilReset} hours.`
      );
    }

    // Check per-minute limit (15 RPM)
    const now = Date.now();
    this.minuteRequests = this.minuteRequests.filter(t => now - t < 60000);

    if (this.minuteRequests.length >= 15) {
      const oldestRequest = this.minuteRequests[0];
      const waitSeconds = Math.ceil((60000 - (now - oldestRequest)) / 1000);

      throw new Error(
        `Rate limit: Please wait ${waitSeconds} seconds before next AI request.`
      );
    }

    // Record this request
    this.minuteRequests.push(now);
    this.dailyCount++;
    localStorage.setItem('ai_daily_count', this.dailyCount.toString());
  }

  getRemainingRequests() {
    this.checkDailyReset();

    const now = Date.now();
    const recentRequests = this.minuteRequests.filter(t => now - t < 60000);

    return {
      daily: 1500 - this.dailyCount,
      perMinute: 15 - recentRequests.length,
      totalDaily: 1500,
      totalPerMinute: 15
    };
  }

  getQuotaStatus() {
    const remaining = this.getRemainingRequests();
    const percentUsed = ((1500 - remaining.daily) / 1500) * 100;

    let status = 'ok';
    let message = `${remaining.daily} AI requests remaining today`;

    if (remaining.daily < 100) {
      status = 'critical';
      message = `Only ${remaining.daily} AI requests left today!`;
    } else if (remaining.daily < 300) {
      status = 'warning';
      message = `${remaining.daily} AI requests remaining today`;
    }

    return {
      status,
      message,
      remaining,
      percentUsed: percentUsed.toFixed(1)
    };
  }

  resetForTesting() {
    this.minuteRequests = [];
    this.dailyCount = 0;
    localStorage.setItem('ai_daily_count', '0');
  }
}

// Singleton instance
export const aiQuota = new AIQuotaManager();

// Export functions
export function checkAILimit() {
  return aiQuota.checkLimit();
}

export function getAIQuota() {
  return aiQuota.getRemainingRequests();
}

export function getAIQuotaStatus() {
  return aiQuota.getQuotaStatus();
}
