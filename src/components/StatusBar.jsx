// StatusBar - FIXED
// Fix 1: gemini-1.5-flash → gemini-2.5-flash
// Fix 2: Cleaner layout - DB campaigns shown properly
// Fix 3: Mobile responsive - AI status hidden on small screens
// Fix 4: Close button so user can dismiss on mobile

import { useState, useEffect } from 'react';
import { db } from '../lib/db';
import { apiKeyManager } from '../lib/api-key-manager';

export function StatusBar() {
  const [dbStatus, setDbStatus] = useState({ count: 0, connected: false });
  const [aiStatus, setAiStatus] = useState({ available: false, model: null });
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [visible, setVisible] = useState(true);
  const [tick, setTick] = useState(0);

  // Poll database every 3 seconds
  useEffect(() => {
    const checkDbStatus = async () => {
      try {
        const count = await db.campaigns.filter(c => !c.deleted).count();
        const connected = db.isOpen();
        setDbStatus({ count, connected });
        setLastUpdate(Date.now());
      } catch (error) {
        setDbStatus({ count: 0, connected: false });
      }
    };

    checkDbStatus();
    const interval = setInterval(checkDbStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  // Update "Xs ago" counter every second
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Check AI status
  useEffect(() => {
    const apiKey = apiKeyManager.getActiveKey();
    if (!apiKey) {
      setAiStatus({ available: false, model: null, reason: 'NO_KEY' });
      return;
    }
    // FIXED: was gemini-1.5-flash
    setAiStatus({ available: true, model: 'gemini-2.5-flash' });
  }, []);

  if (!visible) return null;

  const secondsAgo = Math.floor((Date.now() - lastUpdate) / 1000);

  return (
    <footer className="fixed bottom-0 left-0 right-0 px-4 py-2 z-50 text-xs font-mono" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderTop: '1px solid #1E3048' }}>
      <div className="flex items-center justify-between max-w-7xl mx-auto gap-2">

        {/* Left side: DB status + AI status */}
        <div className="flex items-center gap-3 min-w-0">

          {/* DB campaigns - always visible */}
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`w-2 h-2 rounded-[4px] flex-shrink-0`} style={{ backgroundColor: dbStatus.connected ? '#10B981' : '#DC2626' }} />
            <span style={{ color: '#94A3B8' }}>
              Database:{' '}
              <span style={{ color: dbStatus.count > 0 ? '#047857' : '#94A3B8', fontWeight: dbStatus.count > 0 ? 500 : 400 }}>
                {dbStatus.count} campaigns
              </span>
            </span>
          </div>

          {/* Divider - hidden on mobile */}
          <div className="w-px h-3 hidden sm:block flex-shrink-0" style={{ backgroundColor: '#1E3048' }} />

          {/* AI status - hidden on small mobile to save space */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <div className={`w-2 h-2 rounded-[4px] flex-shrink-0`} style={{ backgroundColor: aiStatus.available ? '#10B981' : '#F59E0B' }} />
            <span style={{ color: '#94A3B8' }}>
              AI:{' '}
              <span style={{ color: aiStatus.available ? '#047857' : '#D97706', fontWeight: aiStatus.available ? 500 : 400 }}>
                {aiStatus.available
                  ? `${aiStatus.model} ready`
                  : aiStatus.reason === 'NO_KEY'
                    ? 'No API key — add in Settings'
                    : 'Unavailable'}
              </span>
            </span>
          </div>
        </div>

        {/* Right side: timestamp + close */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] hidden sm:inline" style={{ color: '#94A3B8' }}>
            Updated {secondsAgo}s ago
          </span>
          <button
            onClick={() => setVisible(false)}
            className="transition-colors px-1"
            style={{ color: '#94A3B8' }}
            title="Hide status bar"
            aria-label="Hide status bar"
          >
            ✕
          </button>
        </div>

      </div>
    </footer>
  );
}