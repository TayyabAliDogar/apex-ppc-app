// Settings Page - API Key Management (Mobile-First, 320px+)
// Risk #1: BYOK Security, Risk #12: Mobile-First Responsive Design

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Key, Save, Trash2, AlertCircle, CheckCircle, Download, Upload, Database } from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { apiKeyManager } from '../lib/api-key-manager';
import { backupManager } from '../lib/backup-manager';
import { db } from '../lib/db';

export function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [savedKey, setSavedKey] = useState('');
  const [isUsingSharedKey, setIsUsingSharedKey] = useState(true);
  const [sharedKeyQuota, setSharedKeyQuota] = useState(null);
  const [message, setMessage] = useState(null);
  const [backupStatus, setBackupStatus] = useState(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const userKey = apiKeyManager.getUserKey();
    if (userKey) {
      setSavedKey(userKey);
      setIsUsingSharedKey(false);
    } else {
      setIsUsingSharedKey(true);
      const quota = apiKeyManager.getSharedKeyQuota();
      setSharedKeyQuota(quota);
    }

    const status = backupManager.getBackupStatus();
    setBackupStatus(status);
  };

  const handleSaveKey = () => {
    // Validate format
    const validation = apiKeyManager.validateKeyFormat(apiKey);
    if (!validation.valid) {
      setMessage({ type: 'error', text: validation.error });
      return;
    }

    // Save key
    const success = apiKeyManager.saveUserKey(apiKey);
    if (success) {
      setMessage({ type: 'success', text: 'API key saved successfully! You now have unlimited AI credits.' });
      setSavedKey(apiKey);
      setApiKey('');
      setIsUsingSharedKey(false);

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: 'Failed to save API key. Please try again.' });
    }
  };

  const handleRemoveKey = () => {
    if (confirm('Remove your personal API key? You will switch back to the shared key (10 requests/hour limit).')) {
      apiKeyManager.removeUserKey();
      setSavedKey('');
      setApiKey('');
      setIsUsingSharedKey(true);
      setMessage({ type: 'success', text: 'API key removed. Using shared key.' });

      // Reload quota
      const quota = apiKeyManager.getSharedKeyQuota();
      setSharedKeyQuota(quota);

      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleExportBackup = async () => {
    const success = await backupManager.exportAllData();
    if (success) {
      setMessage({ type: 'success', text: 'Backup exported successfully!' });
      setTimeout(() => setMessage(null), 3000);
      loadSettings(); // Refresh backup status
    } else {
      setMessage({ type: 'error', text: 'Failed to export backup.' });
    }
  };

  const handleImportBackup = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await backupManager.importData(file);
    if (result.success) {
      setMessage({
        type: 'success',
        text: `Backup imported! ${result.campaigns} campaigns, ${result.keywords} keywords restored.`
      });
      setTimeout(() => setMessage(null), 5000);
    } else {
      setMessage({ type: 'error', text: `Import failed: ${result.error}` });
    }
  };

  // Rule 2.12.2: The Manual 'Big Red Button' (Hard Reset Database)
  const handleHardReset = async () => {
    const confirmed = window.confirm(
      '⚠️ WARNING: This will DELETE ALL DATA permanently.\n\n' +
      'All campaigns, keywords, and search terms will be erased.\n\n' +
      'Are you sure you want to continue?'
    );

    if (!confirmed) return;

    setResetting(true);

    try {
      // Close Dexie instance
      if (db.isOpen()) {
        db.close();
        console.log('✅ Hard Reset: Dexie instance closed');
      }

      // Wait for full release
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use Native IndexedDB API (bypasses Dexie)
      await new Promise((resolve, reject) => {
        const request = window.indexedDB.deleteDatabase('VibePPC');

        request.onsuccess = () => {
          console.log('✅ Hard Reset: Database deleted successfully');
          resolve();
        };

        request.onerror = (e) => {
          console.error('❌ Hard Reset failed:', e);
          reject(e);
        };

        request.onblocked = () => {
          console.warn('⚠️ Hard Reset blocked - Forcing after 2 seconds');
          setTimeout(() => resolve(), 2000);
        };
      });

      // Set flag for post-reset notification
      localStorage.setItem('db_hard_reset', 'true');

      // Force reload
      console.log('🔄 Hard Reset complete - Reloading page');
      window.location.reload();

    } catch (error) {
      console.error('❌ Hard reset error:', error);
      setMessage({
        type: 'error',
        text: 'Reset failed. Please close all browser tabs and try again.'
      });
      setResetting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Status Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-3 rounded-[9px] flex items-center gap-2 text-sm`}
          style={{
            backgroundColor: message.type === 'success' ? 'var(--accent-light)' : 'rgba(239, 68, 68, 0.1)',
            border: message.type === 'success' ? '1px solid var(--success)' : '1px solid var(--error)',
            color: message.type === 'success' ? 'var(--success)' : 'var(--error)'
          }}
        >
          {message.type === 'success' ? (
            <CheckCircle size={16} className="flex-shrink-0" />
          ) : (
            <AlertCircle size={16} className="flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </motion.div>
      )}

      {/* API Key Management */}
      <Card animationDelay={0}>
        <div className="flex items-center gap-3 mb-4">
          <Key size={20} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>API Key Management</h2>
        </div>

        {/* Current Status */}
        <div className="rounded-[9px] p-4 mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Current Status</p>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                {isUsingSharedKey ? 'Using Shared Key' : 'Using Personal Key'}
              </p>
            </div>
            {isUsingSharedKey && sharedKeyQuota && !sharedKeyQuota.unlimited && (
              <div className="text-right">
                <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>Remaining Quota</p>
                <p className="font-medium" style={{ color: 'var(--accent-primary)' }}>
                  {sharedKeyQuota.remaining} / {sharedKeyQuota.total} per hour
                </p>
              </div>
            )}
            {!isUsingSharedKey && (
              <div className="text-right">
                <p className="font-medium flex items-center gap-2" style={{ color: 'var(--accent-primary)' }}>
                  <CheckCircle size={16} />
                  Unlimited Credits
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Shared Key Warning */}
        {isUsingSharedKey && (
          <div className="rounded-[9px] p-3 mb-4" style={{ backgroundColor: 'rgba(251, 191, 36, 0.1)', border: '1px solid var(--warning)' }}>
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--warning)' }} />
              <div className="text-xs" style={{ color: 'var(--text-primary)' }}>
                <p className="font-medium mb-1" style={{ color: 'var(--warning)' }}>Limited Access</p>
                <p>You're using the shared API key with a limit of 10 AI requests per hour. Add your own Gemini API key for unlimited access.</p>
              </div>
            </div>
          </div>
        )}

        {/* Add/Update Key Form */}
        {!savedKey ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>
                Your Gemini API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIza..."
                className="w-full rounded-[9px] px-4 py-3 text-sm focus:outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  color: 'var(--text-primary)',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--input-focus-border)';
                  e.target.style.boxShadow = '0 0 0 3px var(--input-focus-shadow)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--input-border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              <p className="text-xs mt-2" style={{ color: 'var(--text-tertiary)' }}>
                Get your free API key from{' '}
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  Google AI Studio
                </a>
              </p>
            </div>
            <Button
              onClick={handleSaveKey}
              disabled={!apiKey.trim()}
              className="w-full sm:w-auto"
            >
              <Save size={16} />
              Save API Key
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-[9px] p-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <p className="text-sm mb-2" style={{ color: 'var(--text-tertiary)' }}>Saved API Key</p>
              <p className="font-mono text-sm" style={{ color: 'var(--text-secondary)' }}>
                {(savedKey || '').substring(0, 10)}...{(savedKey || '').substring((savedKey || '').length - 4)}
              </p>
            </div>
            <Button
              onClick={handleRemoveKey}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              <Trash2 size={16} />
              Remove Key
            </Button>
          </div>
        )}
      </Card>

      {/* Data Backup */}
      <Card animationDelay={0.08}>
        <div className="flex items-center gap-3 mb-4">
          <Download size={20} style={{ color: 'var(--accent-primary)' }} />
          <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Data Backup</h2>
        </div>

        {/* Backup Status */}
        {backupStatus && (
          <div className="rounded-[9px] p-4 mb-4" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--text-tertiary)' }}>Emergency Backup</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {backupStatus.hasEmergencyBackup ? '✓ Active' : '✗ None'}
                </span>
              </div>
              {backupStatus.lastManualBackup && (
                <div className="flex justify-between">
                  <span style={{ color: 'var(--text-tertiary)' }}>Last Manual Backup</span>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {backupStatus.lastManualBackup.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weekly Reminder */}
        {backupStatus?.needsWeeklyReminder && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-[9px] p-3 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-[#F1F5F9]">
                <p className="font-medium text-amber-400 mb-1">Backup Reminder</p>
                <p>It's been over 7 days since your last backup. Protect your progress by exporting your data now.</p>
              </div>
            </div>
          </div>
        )}

        {/* Backup Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleExportBackup} className="flex-1">
            <Download size={16} />
            Export Backup
          </Button>
          <label className="flex-1">
            <input
              type="file"
              accept=".json"
              onChange={handleImportBackup}
              className="hidden"
            />
            <Button variant="secondary" className="w-full" as="span">
              <Upload size={16} />
              Import Backup
            </Button>
          </label>
        </div>

        {/* Privacy Notice */}
        <div className="mt-4 text-xs flex items-center gap-2" style={{ color: 'var(--text-tertiary)' }}>
          <span style={{ color: 'var(--accent-primary)' }}>🔒</span>
          Local Storage Active: Your data stays on your machine for 100% privacy.
        </div>
      </Card>

      {/* Database Management - Rule 2.12.2: The Big Red Button */}
      <Card animationDelay={0.16}>
        <div className="flex items-center gap-3 mb-4">
          <Database size={20} style={{ color: 'var(--error)' }} />
          <h2 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>Database Management</h2>
        </div>

        {/* Warning Notice */}
        <div className="rounded-[9px] p-3 mb-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)' }}>
          <div className="flex items-start gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--error)' }} />
            <div className="text-xs" style={{ color: 'var(--text-primary)' }}>
              <p className="font-medium mb-1" style={{ color: 'var(--error)' }}>Danger Zone</p>
              <p>If you experience persistent errors or data corruption, use this button to completely reset the database. This action cannot be undone.</p>
            </div>
          </div>
        </div>

        {/* Hard Reset Description */}
        <div className="bg-[#0D1826] rounded-[9px] p-4 mb-4">
          <p className="text-sm text-[#94A3B8] mb-3">
            The Hard Reset will:
          </p>
          <ul className="text-xs text-[#94A3B8] space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">•</span>
              <span>Delete all campaigns, keywords, and search terms</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">•</span>
              <span>Clear all database indexes and schema</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-red-400 mt-0.5">•</span>
              <span>Force a complete page reload</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">•</span>
              <span>Create a fresh database on next load</span>
            </li>
          </ul>
        </div>

        {/* Hard Reset Button */}
        <Button
          onClick={handleHardReset}
          disabled={resetting}
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white"
        >
          <Database size={16} />
          {resetting ? 'Resetting Database...' : '🔴 Hard Reset Database'}
        </Button>

        {/* Help Text */}
        <p className="text-xs text-obsidian-8000 mt-3">
          ⚠️ Only use this if the app is stuck in an error loop or data won't load. Export a backup first if you want to keep your data.
        </p>
      </Card>
    </div>
  );
}
