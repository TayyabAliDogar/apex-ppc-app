// Emerald Insight Card Component - Atomic Addition (Iron Rule #6)
// Section 1.5: UI Protection (Emerald Insight Cards)

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * EmeraldInsightCard - Displays AI-powered optimization insights
 *
 * This component is ADDITIVE ONLY - it never modifies existing data.
 * All changes require explicit user confirmation (Rule 5.2)
 */
export function EmeraldInsightCard({ insight, onDismiss, onApply }) {
  const [dismissed, setDismissed] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  // Check if already dismissed (Rule 5.3)
  const dismissalKey = `insight_dismissed_${insight.id}`;
  if (localStorage.getItem(dismissalKey) === 'true' || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);

    // Store dismissal in localStorage (don't show again)
    localStorage.setItem(dismissalKey, 'true');

    if (onDismiss) {
      onDismiss(insight.id);
    }
  };

  const handleApply = async (actionType = 'primary') => {
    setIsApplying(true);

    try {
      if (onApply) {
        await onApply(insight, actionType);
      }
    } catch (error) {
      console.error('Failed to apply insight:', error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="emerald-insight-card"
      >
        {/* Emerald Badge */}
        <div className="emerald-insight-badge">
          <span>🤖</span>
          <span>AI Insight</span>
        </div>

        {/* Severity Indicator */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-2xl">{insight.severityEmoji}</span>
          <h3 className="text-xl font-[700]" style={{ color: 'var(--text-primary)' }}>
            {insight.title}
          </h3>
        </div>

        {/* Campaign/Keyword Name */}
        <div className="mt-2">
          <p className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>
            Campaign: {insight.campaignName}
          </p>
        </div>

        {/* Problem Statement */}
        <div className="mt-4 space-y-2">
          <div className="rounded-[9px] p-3" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--error)' }}>Problem:</strong> {insight.problem}
            </p>
          </div>

          <div className="rounded-[9px] p-3" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--warning)' }}>Root Cause:</strong> {insight.rootCause}
            </p>
          </div>

          <div className="rounded-[9px] p-3" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--accent-primary)' }}>Recommendation:</strong> {insight.recommendation}
            </p>
          </div>

          <div className="rounded-[9px] p-3" style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              <strong style={{ color: 'var(--info)' }}>Expected Impact:</strong> {insight.expectedImpact}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => handleApply('primary')}
            disabled={isApplying}
            className="flex-1 text-white px-4 py-2 rounded-[9px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--accent-primary)' }}
            onMouseEnter={(e) => !isApplying ? e.currentTarget.style.backgroundColor = 'var(--accent-hover)' : null}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--accent-primary)'}
          >
            {isApplying ? 'Applying...' : insight.primaryAction}
          </button>

          {insight.secondaryAction && (
            <button
              onClick={() => handleApply('secondary')}
              disabled={isApplying}
              className="flex-1 px-4 py-2 rounded-[9px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                color: 'var(--accent-primary)',
                border: '1px solid rgba(16, 185, 129, 0.5)'
              }}
              onMouseEnter={(e) => !isApplying ? e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.3)' : null}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.2)'}
            >
              {insight.secondaryAction}
            </button>
          )}

          <button
            onClick={handleDismiss}
            disabled={isApplying}
            className="px-4 py-2 transition-colors disabled:opacity-50"
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={(e) => !isApplying ? e.currentTarget.style.color = 'var(--text-primary)' : null}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-tertiary)'}
            title="Dismiss this insight"
          >
            ✕
          </button>
        </div>

        {/* Metadata (for debugging) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Type: {insight.type} | Severity: {insight.severity} | ID: {insight.id}
            </p>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * EmeraldInsightList - Container for multiple insights
 * Displays insights in order of severity
 */
export function EmeraldInsightList({ insights, onDismiss, onApply }) {
  if (!insights || insights.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🤖</span>
        <h2 className="text-xl font-[700]" style={{ color: 'var(--accent-primary)' }}>
          AI-Powered Optimizations
        </h2>
        <span className="px-2 py-1 rounded-[4px] text-xs font-medium" style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-primary)' }}>
          {insights.length} {insights.length === 1 ? 'Insight' : 'Insights'}
        </span>
      </div>

      <div className="space-y-4">
        {insights.map(insight => (
          <EmeraldInsightCard
            key={insight.id}
            insight={insight}
            onDismiss={onDismiss}
            onApply={onApply}
          />
        ))}
      </div>
    </div>
  );
}
