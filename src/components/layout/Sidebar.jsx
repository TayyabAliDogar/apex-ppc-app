// Sidebar Navigation - FIXED
// Fix 1: Mobile - sidebar closes when nav item is clicked
// Fix 2: Mobile - proper z-index layering
// Fix 3: Collapse arrow direction fixed
// All existing features (AI quota, storage, backup) unchanged

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, Upload, LayoutDashboard, Target, BarChart3, FileEdit, Settings as SettingsIcon, TrendingUp } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { getAIQuotaStatus } from '../../lib/ai-quota';
import { checkStorageQuota } from '../../lib/storage-monitor';
import { exportToExcel } from '../../lib/export';
import { Button } from '../ui/Button';
import { Logo } from '../ui/Logo';

export function Sidebar({ currentView, onNavigate }) {
  const { sidebarCollapsed, toggleSidebar, hasData } = useStore();
  const [aiQuota, setAIQuota] = useState(null);
  const [storageStatus, setStorageStatus] = useState(null);

  useEffect(() => {
    const updateStatus = () => {
      setAIQuota(getAIQuotaStatus());
      checkStorageQuota().then(setStorageStatus);
    };
    updateStatus();
    const interval = setInterval(updateStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleExportBackup = async () => {
    try {
      const result = await exportToExcel();
      alert(`✅ Excel export successful! Exported ${result.totalRecords} records across ${result.sheets.length} sheets.`);
    } catch (error) {
      alert('❌ Export failed: ' + error.message);
    }
  };

  // FIX: close sidebar on mobile when nav item clicked
  const handleNavigate = (id) => {
    onNavigate(id);
    // On mobile (sidebar was open as overlay), close after navigation
    if (window.innerWidth < 1024 && !sidebarCollapsed) {
      toggleSidebar();
    }
  };

  const navItems = [
    { id: 'home',      label: 'Home',          icon: Home,            enabled: true },
    { id: 'upload',    label: 'Upload',         icon: Upload,          enabled: true },
    { id: 'dashboard', label: 'Dashboard',      icon: LayoutDashboard, enabled: true },
    { id: 'performance', label: 'Performance Hub', icon: TrendingUp,    enabled: true },
    { id: 'insights',  label: 'AI Insights',    icon: Target,          enabled: true },
    { id: 'forecasts', label: 'Analytics',      icon: BarChart3,       enabled: true },
    { id: 'listing',   label: 'Listing Editor', icon: FileEdit,        enabled: true },
    { id: 'settings',  label: 'Settings',       icon: SettingsIcon,    enabled: true },
  ];

  return (
    <>
      {/* Mobile overlay - tap outside to close */}
      {!sidebarCollapsed && (
        <div
          className="fixed inset-0 bg-black/30 z-40 lg:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar panel */}
      <aside
        style={{
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid var(--sidebar-border)',
          transition: 'var(--theme-transition)'
        }}
        className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ${
          sidebarCollapsed
            ? '-translate-x-full lg:translate-x-0 lg:w-20'
            : 'translate-x-0 w-64'
        }`}
      >
        <div className="flex flex-col h-full">

          {/* Logo */}
          <div className="p-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-primary)' }}>
            <div className="flex items-center gap-3">
              <Logo size={40} animated={true} />
              {!sidebarCollapsed && (
                <div className="overflow-hidden">
                  <h1 className="text-lg truncate" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Apex PPC</h1>
                  <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>Peak Performance</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentView === item.id;

              return (
                <motion.button
                  key={item.id}
                  onClick={() => item.enabled && handleNavigate(item.id)}
                  disabled={!item.enabled}
                  whileHover={item.enabled ? { scale: 1.02, x: 4 } : {}}
                  whileTap={item.enabled ? { scale: 0.98 } : {}}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${
                    isActive
                      ? ''
                      : item.enabled
                        ? 'hover:bg-opacity-5 hover:bg-white'
                        : 'cursor-not-allowed opacity-50'
                  }`}
                  style={isActive
                    ? {
                        backgroundColor: 'var(--accent-primary)',
                        color: '#FFFFFF',
                        transition: 'all 0.2s ease',
                        boxShadow: 'var(--glow-primary)'
                      }
                    : item.enabled
                      ? {
                          color: 'var(--text-tertiary)',
                          backgroundColor: 'transparent',
                          transition: 'all 0.2s ease'
                        }
                      : {
                          color: 'var(--text-muted)',
                          transition: 'all 0.2s ease'
                        }
                  }
                  onMouseEnter={(e) => {
                    if (item.enabled && !isActive) {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (item.enabled && !isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-tertiary)';
                    }
                  }}
                  title={sidebarCollapsed ? item.label : (!item.enabled ? 'Upload data first' : '')}
                >
                  <IconComponent size={20} strokeWidth={2.5} className="flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="font-semibold truncate">{item.label}</span>
                  )}
                </motion.button>
              );
            })}
          </nav>

          {/* AI Quota */}
          {!sidebarCollapsed && aiQuota && (
            <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border-primary)' }}>
              <div className="rounded-[9px] p-3" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>AI Requests Today</span>
                  <span className="text-xs font-medium" style={{ color: '#6366F1' }}>
                    {aiQuota.remaining.daily} / {aiQuota.remaining.totalDaily}
                  </span>
                </div>
                <div className="h-2 rounded-[4px] overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${aiQuota.percentUsed}%`,
                      backgroundColor: '#6366F1'
                    }}
                  />
                </div>
                {aiQuota.status !== 'ok' && (
                  <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>{aiQuota.message}</p>
                )}
              </div>
            </div>
          )}

          {/* Storage Warning */}
          {!sidebarCollapsed && storageStatus && storageStatus.status !== 'ok' && (
            <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid #1E2D3D' }}>
              <div className={`rounded-[9px] p-3 ${
                storageStatus.status === 'critical'
                  ? 'bg-red-50 border border-red-300'
                  : 'bg-yellow-50 border border-yellow-300'
              }`}>
                <p className={`text-xs ${
                  storageStatus.status === 'critical' ? 'text-red-700' : 'text-yellow-700'
                }`}>
                  ⚠️ {storageStatus.message}
                </p>
              </div>
            </div>
          )}

          {/* Export Backup */}
          {!sidebarCollapsed && (
            <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border-primary)' }}>
              <button
                className="w-full px-4 py-2.5 rounded-xl transition-all text-sm font-semibold hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)',
                  color: 'var(--text-secondary)',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                  e.currentTarget.style.color = '#FFFFFF';
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  e.currentTarget.style.boxShadow = 'var(--glow-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                  e.currentTarget.style.borderColor = 'var(--border-primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
                }}
                onClick={handleExportBackup}
              >
                💾 Export Backup
              </button>
              <p className="text-xs mt-2 text-center font-medium" style={{ color: 'var(--text-tertiary)' }}>Backup your data regularly</p>
            </div>
          )}

          {/* Collapse toggle */}
          <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid var(--border-primary)' }}>
            <button
              onClick={toggleSidebar}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:scale-105 active:scale-95"
              style={{
                color: 'var(--text-secondary)',
                backgroundColor: 'var(--bg-tertiary)',
                border: '1px solid var(--border-primary)',
                fontWeight: '600'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-elevated)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <span className="text-xl">{sidebarCollapsed ? '→' : '←'}</span>
              {!sidebarCollapsed && <span className="text-sm">Collapse</span>}
            </button>
          </div>

        </div>
      </aside>
    </>
  );
}
