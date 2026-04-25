import { useState, useEffect, Component } from 'react'
import { motion } from 'framer-motion'
import './index.css'
import { Layout } from './components/layout/Layout'
import { Button } from './components/ui/Button'
import { Card, MetricCard } from './components/ui/Card'
import { CSVUploader } from './components/CSVUploader'
import { Dashboard } from './components/dashboard/Dashboard'
import { Analytics } from './components/Analytics'
import { Insights } from './components/Insights'
import { Diagnostic } from './components/Diagnostic'
import { ListingEditor } from './components/ListingEditor'
import { Settings } from './components/Settings'
import { StatusBar } from './components/StatusBar'
import { ExampleDashboard } from './components/examples/ExampleDashboard'
import { PerformanceHub } from './components/PerformanceHub'
import { db, queries, initializeDatabase } from './lib/db'
import { useStore } from './store/useStore'
import { checkLastBackup, requestPersistentStorage } from './lib/storage-monitor'
import { cardHover } from './lib/animations'
import { tabSync, SYNC_EVENTS } from './lib/tab-sync'
import { backupManager } from './lib/backup-manager'

class StatusBarErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  componentDidCatch(error, errorInfo) { console.error('StatusBar Error:', error, errorInfo); }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

function App() {
  const [view, setView] = useState('home')
  const [metrics, setMetrics] = useState(null)
  const [initError, setInitError] = useState(null)
  const [showDbOptimized, setShowDbOptimized] = useState(false)
  const [showNuclearResetNotification, setShowNuclearResetNotification] = useState(false)
  const [dbReady, setDbReady] = useState(false)
  const [isNuclearReset, setIsNuclearReset] = useState(false)
  const [needsManualReset, setNeedsManualReset] = useState(false)
  const [resetError, setResetError] = useState(null)
  const [autoReloadCountdown, setAutoReloadCountdown] = useState(10)
  const [showStatusBar, setShowStatusBar] = useState(false)
  const { hasData, setHasData, showDataLossWarning, dismissDataLossWarning, setShowBackupReminder } = useStore()

  const logStartupDiagnostics = () => {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      port: import.meta.env.VITE_PORT || 'default (5173)',
      dbName: import.meta.env.VITE_DB_NAME || 'ApexPPC',
      dbVersion: db.verno,
      apiEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
      environment: import.meta.env.MODE
    };
    console.log('═══════════════════════════════════════════');
    console.log('🚀 Apex PPC Session Started');
    console.log('═══════════════════════════════════════════');
    console.log(`📅 Timestamp: ${diagnostics.timestamp}`);
    console.log(`🌐 Active Port: ${diagnostics.port}`);
    console.log(`📊 Database: ${diagnostics.dbName} (v${diagnostics.dbVersion})`);
    console.log(`🤖 AI Endpoint: ${diagnostics.apiEndpoint}`);
    console.log(`🔧 Environment: ${diagnostics.environment}`);
    console.log('═══════════════════════════════════════════');
    sessionStorage.setItem('startup_diagnostics', JSON.stringify(diagnostics));
    return diagnostics;
  };

  useEffect(() => {
    setTimeout(() => { logStartupDiagnostics(); }, 0);
    setTimeout(() => { setShowStatusBar(true); }, 0);

    const wasOptimized = localStorage.getItem('db_optimized');
    if (wasOptimized === 'true') {
      setShowDbOptimized(true);
      localStorage.removeItem('db_optimized');
      setTimeout(() => setShowDbOptimized(false), 5000);
    }

    const wasNuclearReset = localStorage.getItem('db_nuclear_reset');
    if (wasNuclearReset === 'true') {
      setShowNuclearResetNotification(true);
      localStorage.removeItem('db_nuclear_reset');
      setTimeout(() => setShowNuclearResetNotification(false), 8000);
    }

    const wasHardReset = localStorage.getItem('db_hard_reset');
    if (wasHardReset === 'true') {
      setShowNuclearResetNotification(true);
      localStorage.removeItem('db_hard_reset');
      setTimeout(() => setShowNuclearResetNotification(false), 8000);
    }

    initializeApp().catch(err => {
      console.error('Failed to initialize app:', err)
      setInitError(err.message)
    })

    tabSync.subscribe(SYNC_EVENTS.DATA_UPDATED, () => {
      checkForData();
      if (hasData) loadMetrics();
    });
    tabSync.subscribe(SYNC_EVENTS.CAMPAIGNS_UPLOADED, () => {
      checkForData();
      loadMetrics();
    });

    const status = backupManager.getBackupStatus();
    if (status.needsWeeklyReminder) setShowBackupReminder(true);

    return () => { tabSync.close(); };
  }, [])

  const initializeApp = async () => {
    try {
      setDbReady(true);
      const dbPromise = initializeDatabase();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database timeout')), 2000)
      );
      try {
        const dbStatus = await Promise.race([dbPromise, timeoutPromise]);
        if (dbStatus.nuclearReset) { setIsNuclearReset(true); return; }
        if (dbStatus.needsManualReset) {
          setNeedsManualReset(true);
          setResetError(dbStatus.error);
          startAutoReloadCountdown();
          return;
        }
        if (dbStatus.flushed) return;
        await checkForData();
        const backupStatus = checkLastBackup();
        if (backupStatus.needsBackup) setShowBackupReminder(true);
      } catch (timeoutError) {
        console.warn('⚠️ Database initialization timeout - loading with 0 campaigns');
        setHasData(false);
        setMetrics(null);
      }
      requestPersistentStorage().catch(err => console.warn('Persistent storage request failed:', err));
    } catch (error) {
      console.error('❌ App initialization failed:', error);
      setInitError(error.message);
    }
  }

  const startAutoReloadCountdown = () => {
    let countdown = 10;
    setAutoReloadCountdown(countdown);
    const interval = setInterval(() => {
      countdown--;
      setAutoReloadCountdown(countdown);
      if (countdown <= 0) { clearInterval(interval); handleManualReset(); }
    }, 1000);
  };

  const handleManualReset = async () => {
    try {
      if (db.isOpen()) db.close();
      await new Promise(resolve => setTimeout(resolve, 500));
      await new Promise((resolve, reject) => {
        const request = window.indexedDB.deleteDatabase('VibePPC');
        request.onsuccess = () => resolve();
        request.onerror = (e) => reject(e);
        request.onblocked = () => setTimeout(() => resolve(), 2000);
      });
      localStorage.setItem('db_nuclear_reset', 'true');
      window.location.reload();
    } catch (error) {
      alert('Database reset encountered an issue. The page will reload. If problems persist, please close all browser tabs and try again.');
      window.location.reload();
    }
  };

  const checkForData = async () => {
    try {
      if (!db.isOpen()) await db.open();
      const count = await db.campaigns.filter(c => !c.deleted).count()
      setHasData(count > 0)
      if (count > 0) loadMetrics()
    } catch (error) {
      console.error('Error checking for data:', error)
      setHasData(false)
    }
  }

  // ONLY CHANGE IN THIS FILE: 30 days → 90 days
  const loadMetrics = async () => {
    try {
      const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000)
      const now = Date.now()
      const data = await queries.calculateTotalMetrics(ninetyDaysAgo, now)
      setMetrics(data)
    } catch (error) {
      console.error('Error loading metrics:', error)
      setMetrics(null)
    }
  }

  const handleUploadComplete = async () => {
    await checkForData()
    setView('dashboard')
  }

  const handleNavigate = (newView) => { setView(newView) }

  if (isNuclearReset) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', transition: 'var(--theme-transition)' }}>
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">🔄</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Upgrading Database</h2>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Optimizing system for Apex PPC V8... Please wait.</p>
        </div>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', transition: 'var(--theme-transition)' }}>
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--error)' }}>Database Error</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>{initError}</p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 rounded-lg" style={{ backgroundColor: 'var(--accent-primary)', color: '#FFFFFF' }}>
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (needsManualReset) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', transition: 'var(--theme-transition)' }}>
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">🔧</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--warning)' }}>System Repairing</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-tertiary)' }}>The database reset requires manual completion. The system will auto-refresh shortly.</p>
          {resetError && (
            <p className="text-xs mb-4 font-mono p-2 rounded" style={{ color: 'var(--error)', backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>{resetError}</p>
          )}
          <div className="mb-6">
            <div className="text-4xl font-bold mb-2" style={{ color: 'var(--accent-primary)' }}>{autoReloadCountdown}</div>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Auto-refresh in {autoReloadCountdown} seconds</p>
          </div>
          <button onClick={handleManualReset} className="px-6 py-3 rounded-lg font-medium transition-colors mb-3" style={{ backgroundColor: 'var(--accent-primary)', color: '#FFFFFF' }}>
            Complete Reset Now
          </button>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>If this persists, close all browser tabs and try again</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Layout
        currentView={view}
        onNavigate={handleNavigate}
        title={getPageTitle(view)}
        subtitle={getPageSubtitle(view)}
        headerActions={getHeaderActions(view, handleNavigate)}
      >
        {showNuclearResetNotification && (
          <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <div className="flex items-start gap-3">
              <span className="text-lg" style={{ color: 'var(--info)' }}>🔄</span>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--info)' }}>Database upgraded to Apex PPC V8</p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Please re-upload your data to continue</p>
              </div>
              <button onClick={() => setShowNuclearResetNotification(false)} className="text-sm" style={{ color: 'var(--info)' }}>✕</button>
            </div>
          </div>
        )}

        {showDbOptimized && (
          <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: 'var(--accent-light)', border: '1px solid var(--accent-primary)' }}>
            <div className="flex items-start gap-3">
              <span className="text-lg" style={{ color: 'var(--success)' }}>✓</span>
              <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--success)' }}>Database optimized for compatibility</p>
              </div>
              <button onClick={() => setShowDbOptimized(false)} className="text-sm" style={{ color: 'var(--success)' }}>✕</button>
            </div>
          </div>
        )}

        {initError && (
          <div className="rounded-lg p-3 mb-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <div className="flex items-start gap-3">
              <span className="text-lg" style={{ color: 'var(--error)' }}>⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1" style={{ color: 'var(--error)' }}>Initialization Error</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{initError}</p>
                <button onClick={() => window.location.reload()} className="mt-2 text-xs underline" style={{ color: 'var(--error)' }}>Reload Page</button>
              </div>
            </div>
          </div>
        )}

        {showDataLossWarning && (
          <div className="rounded-lg p-3 mb-4 relative z-10" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
            <div className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0" style={{ color: 'var(--warning)' }}>💡</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium mb-1" style={{ color: 'var(--warning)' }}>Browser Storage Notice</p>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Your data is stored locally in your browser. Remember to export backups regularly to prevent data loss.</p>
              </div>
              <button onClick={dismissDataLossWarning} className="flex-shrink-0 text-sm" style={{ color: 'var(--warning)' }} title="Dismiss forever">✕</button>
            </div>
          </div>
        )}

        {view === 'home'      && <HomeView hasData={hasData} metrics={metrics} onNavigate={handleNavigate} />}
        {view === 'upload'    && <UploadView onComplete={handleUploadComplete} />}
        {view === 'dashboard' && <Dashboard onNavigate={handleNavigate} />}
        {view === 'insights'  && <Insights />}
        {view === 'forecasts' && <Analytics />}
        {view === 'listing'   && <ListingEditor />}
        {view === 'settings'  && <Settings />}
        {view === 'example'   && <ExampleDashboard />}
        {view === 'performance' && <PerformanceHub />}
      </Layout>

      <StatusBarErrorBoundary>
        {showStatusBar && <StatusBar />}
      </StatusBarErrorBoundary>
    </>
  )
}

function getPageTitle(view) {
  const titles = {
    home: 'Welcome to Apex PPC', upload: 'Upload Amazon Report',
    dashboard: 'Financial Dashboard', insights: 'AI Insights',
    forecasts: 'Analytics Charts', listing: 'Listing Editor', settings: 'Settings',
    performance: 'Performance Command Center'
  }
  return titles[view] || 'Apex PPC'
}

function getPageSubtitle(view) {
  const subtitles = {
    home: 'Transform PPC complexity into actionable clarity in under 5 minutes daily',
    upload: 'Upload your Amazon Advertising bulk report to get started',
    dashboard: 'Last 90 days performance overview',
    insights: 'AI-powered bleeding keyword detection and bid optimization',
    forecasts: 'Sales vs Spend analytics with visual charts',
    listing: 'Optimize your Amazon listings with AI-powered suggestions',
    settings: 'Manage your API keys and data backups',
    performance: 'Campaign intelligence, TACoS calculator, and budget pacing with your real data'
  }
  return subtitles[view]
}

function getHeaderActions(view, onNavigate) {
  if (view === 'home') return (
    <Button
      onClick={() => onNavigate('upload')}
      style={{
        backgroundColor: '#10B981',
        transition: 'background 0.15s ease, transform 0.1s ease, opacity 0.1s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#0EA572';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#10B981';
      }}
    >
      Upload Report
    </Button>
  )
  return null
}

function HomeView({ hasData, metrics, onNavigate }) {
  const featureCards = [
    { icon: '💰', title: 'Financial Clarity',        description: 'Real-time ROAS, TACoS, and wasted spend tracking',             route: 'forecasts', enabled: true },
    { icon: '🎯', title: 'PPC Actionability',         description: 'AI-powered bleeding keyword detection and bid optimization',    route: 'insights',  enabled: true },
    { icon: '📝', title: 'Content Strategy',          description: 'Optimize your Amazon listings with AI-powered suggestions',     route: 'listing',   enabled: true },
    { icon: '🔮', title: 'Predictive Intelligence',   description: 'Forecast future performance and budget needs',                  route: 'dashboard', enabled: true }
  ];

  return (
    <div>
      {hasData && metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <MetricCard label="ROAS" value={metrics.roas.toFixed(2)} animationDelay={0} />
          <MetricCard label="ACoS" value={`${metrics.acos.toFixed(1)}%`} animationDelay={0.08} />
          <MetricCard label="Total Spend" value={`$${metrics.totalSpend.toLocaleString()}`} animationDelay={0.16} />
          <MetricCard label="Total Sales" value={`$${metrics.totalSales.toLocaleString()}`} animationDelay={0.24} />
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {featureCards.map((card, idx) => (
          <FeatureCard key={idx} {...card} onNavigate={onNavigate} animationDelay={idx * 0.08} />
        ))}
      </div>

      {!hasData && (
        <Card>
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--accent-light)' }}>
              <span className="text-4xl">📤</span>
            </div>
            <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Get Started</h3>
            <p className="mb-6" style={{ color: 'var(--text-tertiary)' }}>Upload your first Amazon report to unlock AI-powered insights</p>
            <Button onClick={() => onNavigate('upload')}>Upload Report</Button>
          </div>
        </Card>
      )}
    </div>
  )
}

function UploadView({ onComplete }) {
  return <div><CSVUploader onComplete={onComplete} /></div>
}

function FeatureCard({ icon, title, description, route, enabled, onNavigate, animationDelay = 0 }) {
  const iconBgColors = {
    '💰': 'rgba(59, 130, 246, 0.1)',
    '🎯': 'rgba(251, 146, 60, 0.1)',
    '📝': 'rgba(16, 185, 129, 0.1)',
    '🔮': 'rgba(139, 92, 246, 0.1)'
  };

  return (
    <motion.div
      variants={cardHover}
      initial="rest"
      whileHover="hover"
      onClick={() => { if (enabled) onNavigate(route); }}
      className="rounded-lg p-6 cursor-pointer"
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        opacity: 0,
        animation: `fadeSlideUp 0.3s ease forwards ${animationDelay}s`,
        transition: 'border-color 0.2s ease, background-color 0.3s ease'
      }}
    >
      <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: iconBgColors[icon] || 'var(--bg-tertiary)' }}>
        <span className="text-2xl">{icon}</span>
      </div>
      <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{description}</p>
    </motion.div>
  );
}

export default App