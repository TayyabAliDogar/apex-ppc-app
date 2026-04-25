// Rule 2.13.1: Pre-Flight Version Check (Boot-Time Kill Switch)
// CRITICAL: This MUST run BEFORE any imports to prevent Dexie initialization race condition

const CURRENT_VERSION = 'v8';
const VERSION_KEY = 'vibeppc_db_version';

// Rule 2.20.2: Request Persistent Storage (Data Eviction Prevention)
// CRITICAL: Request persistent storage BEFORE version check to prevent data loss
async function requestPersistentStorage() {
  if (navigator.storage && navigator.storage.persist) {
    try {
      const isPersisted = await navigator.storage.persist();
      if (isPersisted) {
        console.log('✅ Persistent storage granted - Data will not be evicted');
      } else {
        console.warn('⚠️ Persistent storage denied - Data may be evicted by browser');
        console.warn('💡 User action required: Grant storage permission in browser settings');
      }
      return isPersisted;
    } catch (error) {
      console.error('❌ Failed to request persistent storage:', error);
      return false;
    }
  } else {
    console.warn('⚠️ Persistent storage API not available in this browser');
    return false;
  }
}

// Request persistent storage immediately
requestPersistentStorage();

// Check version BEFORE any imports
const storedVersion = localStorage.getItem(VERSION_KEY);

if (storedVersion !== CURRENT_VERSION) {
  console.log(`🚨 Version mismatch detected: ${storedVersion || 'none'} → ${CURRENT_VERSION}`);
  console.log('🔥 Triggering Pre-Flight Purge...');

  // Use Native IndexedDB API (no Dexie dependency)
  const deleteRequest = indexedDB.deleteDatabase('VibePPC');

  deleteRequest.onsuccess = () => {
    console.log('✅ Pre-Flight Purge: Database deleted successfully');
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    console.log('🔄 Reloading application...');
    window.location.reload();
  };

  deleteRequest.onerror = (e) => {
    console.error('❌ Pre-Flight Purge failed:', e);
    // Force reload anyway - fresh start
    localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
    window.location.reload();
  };

  deleteRequest.onblocked = () => {
    console.warn('⚠️ Pre-Flight Purge blocked - Forcing reload in 2s');
    setTimeout(() => {
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
      window.location.reload();
    }, 2000);
  };

  // CRITICAL: Throw error to prevent further execution
  throw new Error('Pre-Flight Purge in progress - Reloading...');
}

// Version matches - safe to proceed with imports
console.log(`✅ Pre-Flight check passed: ${CURRENT_VERSION}`);

// NOW import libraries (after version check)
import { StrictMode, Component } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import './lib/clear-data.js'  // Load debug utilities
import { ThemeProvider } from './contexts/ThemeContext.jsx'

// Error boundary fallback
class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('React Error Boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0a0a0a',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{ maxWidth: '600px', textAlign: 'center' }}>
            <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>⚠️ App Error</h1>
            <p style={{ color: '#999', marginBottom: '16px' }}>
              {this.state.error?.message || 'Something went wrong'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#10b981',
                color: '#fff',
                padding: '12px 24px',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const root = createRoot(document.getElementById('root'))

root.render(
  <StrictMode>
    <ErrorBoundary>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </StrictMode>
)
