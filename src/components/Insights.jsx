// AI Insights View with Bleeding Keyword Detection
import { useState, useEffect } from 'react';
import { Card, MetricCard } from './ui/Card';
import { Button } from './ui/Button';
import { detectBleedingKeywords, getAIInsightsSummary } from '../services/aiService';
import { db } from '../lib/db';

export function Insights() {
  const [insights, setInsights] = useState(null);
  const [bleeding, setBleeding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(null);

  useEffect(() => {
    loadInsights();
  }, []);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const [summaryData, bleedingData] = await Promise.all([
        getAIInsightsSummary(30),
        detectBleedingKeywords({ minSpend: 50, minClicks: 10 })
      ]);

      setInsights(summaryData);
      setBleeding(bleedingData);
    } catch (error) {
      console.error('Failed to load insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizeBid = async (campaign, index) => {
    setOptimizing(index);

    try {
      // Store optimization action in insights table
      await db.insights.add({
        type: 'bid_optimization',
        severity: 'high',
        campaignId: campaign.id,
        action: 'PAUSE_OR_REDUCE',
        originalSpend: campaign.spend,
        recommendation: 'Reduce bid by 50% or pause campaign',
        createdAt: Date.now()
      });

      // Show success message
      alert(`✅ Optimization signal sent to local DB!\n\nCampaign: ${campaign.campaignName}\nAction: Reduce bid by 50%\nPotential Savings: $${(campaign.spend * 0.8).toFixed(2)}`);
    } catch (error) {
      alert('❌ Failed to save optimization: ' + error.message);
    } finally {
      setOptimizing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-[4px] animate-spin mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)' }}></div>
          <p style={{ color: 'var(--text-tertiary)' }}>Analyzing your campaigns...</p>
        </div>
      </div>
    );
  }

  if (!insights) {
    return (
      <Card>
        <div className="text-center py-8">
          <p style={{ color: 'var(--text-tertiary)' }}>No data available. Upload a report to get AI insights.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Campaigns"
          value={insights.totalCampaigns}
          icon="📊"
          animationDelay={0}
        />
        <MetricCard
          label="Bleeding Keywords"
          value={insights.bleedingCount}
          icon="🩸"
          animationDelay={0.08}
        />
        <MetricCard
          label="Wasted Spend"
          value={`$${insights.totalWaste.toFixed(2)}`}
          icon="💸"
          animationDelay={0.16}
        />
        <MetricCard
          label="Avg ROAS"
          value={insights.avgROAS}
          icon="📈"
          animationDelay={0.24}
        />
      </div>

      {/* Bleeding Keywords Alert */}
      {bleeding && bleeding.count > 0 && (
        <Card title="🩸 Bleeding Keywords Detected" animationDelay={0}>
          <div className="rounded-[9px] p-4 mb-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <h3 className="font-bold mb-2" style={{ color: 'var(--error)' }}>
              ⚠️ Critical: {bleeding.count} campaigns are bleeding money
            </h3>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              These campaigns have significant spend but ZERO sales. Total waste: ${bleeding.totalWaste.toFixed(2)}
            </p>
          </div>

          <div className="space-y-3">
            {bleeding.bleedingCampaigns.slice(0, 5).map((campaign, idx) => (
              <div
                key={idx}
                className="rounded-[9px] p-4 transition-colors"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-primary)'
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{campaign.campaignName}</h4>
                    {campaign.asin && (
                      <p className="text-xs font-semibold" style={{ color: 'var(--text-tertiary)' }}>ASIN: {campaign.asin}</p>
                    )}
                  </div>
                  <span className="px-3 py-1 text-xs font-medium rounded-[4px]" style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: 'var(--error)', animation: 'bleedPulse 2s ease infinite' }}>
                    BLEEDING
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                  <div>
                    <span className="font-bold" style={{ color: 'var(--text-tertiary)' }}>Spend:</span>
                    <span className="font-medium ml-2" style={{ color: 'var(--error)' }}>${campaign.spend.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="font-bold" style={{ color: 'var(--text-tertiary)' }}>Sales:</span>
                    <span className="font-medium ml-2" style={{ color: 'var(--text-secondary)' }}>$0.00</span>
                  </div>
                  <div>
                    <span className="font-bold" style={{ color: 'var(--text-tertiary)' }}>Clicks:</span>
                    <span className="font-medium ml-2" style={{ color: 'var(--text-secondary)' }}>{campaign.clicks}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid var(--border-primary)' }}>
                  <p className="text-xs flex-1" style={{ color: 'var(--warning)' }}>
                    💡 Reduce bid by 50% or pause
                  </p>
                  <button
                    onClick={() => handleOptimizeBid(campaign, idx)}
                    disabled={optimizing === idx}
                    className={`px-4 py-2 rounded-[9px] text-sm font-medium transition-colors ${
                      optimizing === idx
                        ? 'cursor-not-allowed'
                        : ''
                    }`}
                    style={{
                      backgroundColor: optimizing === idx ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
                      color: optimizing === idx ? 'var(--text-tertiary)' : '#FFFFFF'
                    }}
                  >
                    {optimizing === idx ? '⏳ Optimizing...' : '🎯 Optimize Bid'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Recommendations */}
      {bleeding && bleeding.recommendations && bleeding.recommendations.length > 0 && (
        <Card title="🎯 AI Recommendations" animationDelay={0.08}>
          <div className="space-y-3">
            {bleeding.recommendations.slice(0, 5).map((rec, idx) => (
              <div
                key={idx}
                className="rounded-[9px] p-4"
                style={{
                  backgroundColor: rec.severity === 'critical'
                    ? 'rgba(239, 68, 68, 0.1)'
                    : rec.severity === 'high'
                    ? 'rgba(251, 191, 36, 0.1)'
                    : 'var(--bg-secondary)',
                  border: rec.severity === 'critical'
                    ? '1px solid rgba(239, 68, 68, 0.5)'
                    : rec.severity === 'high'
                    ? '1px solid rgba(251, 191, 36, 0.5)'
                    : '1px solid var(--border-primary)'
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>{rec.campaignName}</h4>
                  <span
                    className="px-2 py-1 text-xs font-medium rounded"
                    style={{
                      backgroundColor: rec.severity === 'critical'
                        ? 'rgba(239, 68, 68, 0.2)'
                        : rec.severity === 'high'
                        ? 'rgba(251, 191, 36, 0.2)'
                        : 'rgba(148, 163, 184, 0.2)',
                      color: rec.severity === 'critical'
                        ? '#EF4444'
                        : rec.severity === 'high'
                        ? '#FBBF24'
                        : 'var(--text-tertiary)'
                    }}
                  >
                    {rec.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{rec.suggestion}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold" style={{ color: 'var(--text-tertiary)' }}>Potential Savings:</span>
                  <span className="font-medium" style={{ color: 'var(--success)' }}>
                    ${rec.potentialSavings.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Performance Summary */}
      <Card title="📊 Performance Summary" animationDelay={0.16}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-[9px] p-4" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)' }}>
            <div className="text-3xl font-[700] mb-1" style={{ color: 'var(--success)' }}>
              {insights.excellentCampaigns}
            </div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Excellent Campaigns</div>
            <div className="text-xs mt-1 font-semibold" style={{ color: 'var(--text-tertiary)' }}>ROAS ≥ 3.0</div>
          </div>
          <div className="rounded-[9px] p-4" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)' }}>
            <div className="text-3xl font-[700] mb-1" style={{ color: 'var(--error)' }}>
              {insights.poorCampaigns}
            </div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Poor Campaigns</div>
            <div className="text-xs mt-1 font-semibold" style={{ color: 'var(--text-tertiary)' }}>ROAS &lt; 1.0</div>
          </div>
          <div className="rounded-[9px] p-4" style={{ backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}>
            <div className="text-3xl font-[700] mb-1" style={{ color: 'var(--text-secondary)' }}>
              {insights.avgROAS}
            </div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Average ROAS</div>
            <div className="text-xs mt-1 font-semibold" style={{ color: 'var(--text-tertiary)' }}>Last 30 days</div>
          </div>
        </div>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button onClick={loadInsights}>
          🔄 Refresh Insights
        </Button>
      </div>
    </div>
  );
}
