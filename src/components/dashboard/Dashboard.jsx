import { useState, useEffect } from 'react';
import { Card, MetricCard } from '../ui/Card';
import { Button } from '../ui/Button';
import { TrendChart, SpendChart, CampaignBreakdownChart, ROASChart } from '../charts/Charts';
import { db, queries, safeParseDate, safeParseFloat, extractDate, getMaxDateFromData } from '../../lib/db';
import { exportAllData, exportToCSV } from '../../lib/export';
import { checkLastBackup } from '../../lib/storage-monitor';
import { AnimatedNumber } from '../ui/AnimatedNumber';

export function Dashboard({ onNavigate }) {
  const [metrics, setMetrics] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [dateRange, setDateRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(true);
  const [showBackupReminder, setShowBackupReminder] = useState(false);

  useEffect(() => {
    loadDashboardData();
    checkBackupStatus();
  }, [dateRange]);

  const checkBackupStatus = () => {
    const backupStatus = checkLastBackup();
    setShowBackupReminder(backupStatus.needsBackup);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      if (!db.isOpen()) await db.open();

      const allCampaignsRaw = await db.campaigns.toArray();

      if (allCampaignsRaw.length === 0) {
        setHasData(false);
        setLoading(false);
        return;
      }
      setHasData(true);

      // Use shared utility to get max date
      const maxDate = await getMaxDateFromData();

      console.log('🔍 [Dashboard] Max date found:', new Date(maxDate).toISOString());
      console.log('🔍 [Dashboard] Selected period:', dateRange);

      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : null;
      const startDate = days ? maxDate - (days * 24 * 60 * 60 * 1000) : 0;
      const endDate = maxDate;

      console.log('🔍 [Dashboard] Date range:', {
        start: startDate === 0 ? 'All Time' : new Date(startDate).toISOString(),
        end: new Date(endDate).toISOString(),
        days: days || 'all'
      });

      const campaigns = await queries.getCampaignsByDateRange(startDate, endDate);

      console.log('🔍 [Dashboard] Campaigns in range:', campaigns.length);

      const metricsData = {
        totalSpend: campaigns.reduce((sum, c) => sum + safeParseFloat(c?.spend), 0),
        totalSales: campaigns.reduce((sum, c) => sum + safeParseFloat(c?.sales), 0),
        totalImpressions: campaigns.reduce((sum, c) => sum + safeParseFloat(c?.impressions), 0),
        totalClicks: campaigns.reduce((sum, c) => sum + safeParseFloat(c?.clicks), 0)
      };

      metricsData.roas = metricsData.totalSpend > 0 ? metricsData.totalSales / metricsData.totalSpend : 0;
      metricsData.acos = metricsData.totalSales > 0 ? (metricsData.totalSpend / metricsData.totalSales) * 100 : 0;
      metricsData.ctr = metricsData.totalImpressions > 0 ? (metricsData.totalClicks / metricsData.totalImpressions) * 100 : 0;

      console.log('🔍 [Dashboard] Metrics calculated:', {
        period: dateRange,
        campaignCount: campaigns.length,
        totalSpend: metricsData.totalSpend.toFixed(2),
        totalSales: metricsData.totalSales.toFixed(2),
        roas: metricsData.roas.toFixed(2),
        acos: metricsData.acos.toFixed(2)
      });

      setMetrics(metricsData);

      const dailyData = groupByDate(campaigns);
      console.log('🔍 [Dashboard] Daily data points:', dailyData.length);
      console.log('🔍 [Dashboard] Daily data sample:', dailyData.slice(0, 3));

      const topCampaigns = await queries.getTopCampaigns(5, startDate, endDate);
      console.log('🔍 [Dashboard] Top campaigns:', topCampaigns.length);

      const campaignBreakdown = topCampaigns.map(c => ({
        name: (c?.campaignName || 'Unknown'),
        value: Number(safeParseFloat(c?.spend).toFixed(2))
      }));

      console.log('🔍 [Dashboard] Campaign breakdown:', campaignBreakdown);

      setChartData({ daily: dailyData, campaignBreakdown });
      console.log('🔍 [Dashboard] Chart data set successfully');
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // FIX: groupByDate — consistent YYYY-MM-DD key use karo
  // Pehle toLocaleDateString tha jo browser-to-browser alag hota tha
  // Ab ISO date string use kar rahe hain — charts reliable hain
  // ============================================================
  const groupByDate = (campaigns) => {
    const grouped = {};

    console.log('🔍 [groupByDate] Processing campaigns:', campaigns.length);
    let skipped = 0;
    let processed = 0;

    campaigns.forEach((c, idx) => {
      let rawDate = extractDate(c);

      if (idx < 3) {
        console.log(`🔍 [groupByDate] Campaign ${idx}:`,
          'Name:', c?.campaignName,
          'RawDate:', rawDate,
          'Type:', typeof rawDate
        );
      }

      if (!rawDate || String(rawDate).toLowerCase() === 'date') {
        skipped++;
        return;
      }

      let parsedTime = safeParseDate(rawDate);

      if (idx < 3) {
        console.log(`🔍 [groupByDate] ParsedTime ${idx}:`, parsedTime, 'isNaN:', isNaN(parsedTime));
      }

      if (isNaN(parsedTime)) {
        skipped++;
        return;
      }

      processed++;

      const dateObj = new Date(parsedTime);

      // FIX: consistent key — "2024-01-15" format
      const yyyy = dateObj.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;

      // Chart mein readable label — "Jan 15" format
      const dateLabel = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      if (!grouped[dateKey]) {
        grouped[dateKey] = {
          date: dateLabel,      // Chart display ke liye
          dateKey: dateKey,     // Sorting ke liye
          timestamp: parsedTime,
          spend: 0,
          sales: 0,
          roas: 0,
          count: 0
        };
      }

      grouped[dateKey].spend += safeParseFloat(c?.spend);
      grouped[dateKey].sales += safeParseFloat(c?.sales);
      grouped[dateKey].count += 1;
    });

    console.log('🔍 [groupByDate] Summary:',
      'Total:', campaigns.length,
      'Processed:', processed,
      'Skipped:', skipped,
      'UniqueDates:', Object.keys(grouped).length
    );

    return Object.values(grouped).map(day => ({
      ...day,
      spend: Number(day.spend.toFixed(2)),
      sales: Number(day.sales.toFixed(2)),
      roas: Number((day.spend > 0 ? day.sales / day.spend : 0).toFixed(2)),
      target: 3.0
    })).sort((a, b) => a.dateKey.localeCompare(b.dateKey)); // FIX: string sort on YYYY-MM-DD is reliable
  };

  const handleExport = async (format) => {
    try {
      if (format === 'json') {
        const result = await exportAllData();
        alert(`Successfully exported ${result.totalRecords} records`);
        setShowBackupReminder(false);
      } else if (format === 'csv') {
        const result = await exportToCSV();
        alert(`Successfully exported ${result.totalRecords} campaigns to CSV`);
      }
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-16 h-16 border-4 border-t-transparent rounded-[4px] animate-spin" style={{ borderColor: 'var(--accent-primary)' }}></div>
    </div>
  );

  if (!hasData) {
    return (
      <Card>
        <div className="text-center py-8">
          <p style={{ color: 'var(--text-tertiary)' }}>No data available. Upload a report to get started.</p>
          <Button onClick={() => onNavigate('upload')} className="mt-4">Upload Report</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['7d', '30d', '90d', 'all'].map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-[9px] text-sm font-medium transition-colors ${
                dateRange === range ? 'bg-[#10B981] text-white' : 'bg-[#0D1826] text-[#F1F5F9] hover:bg-obsidian-700'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : 'All Time'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="ROAS"
          value={<AnimatedNumber value={metrics?.roas ?? 0} decimals={2} duration={800} />}
          icon="📈"
          animationDelay={0}
        />
        <MetricCard
          label="ACoS"
          value={<><AnimatedNumber value={metrics?.acos ?? 0} decimals={1} duration={800} />%</>}
          icon="🎯"
          animationDelay={0.08}
        />
        <MetricCard
          label="Total Spend"
          value={<>$<AnimatedNumber value={metrics?.totalSpend ?? 0} decimals={2} formatNumber={true} duration={800} /></>}
          icon="💰"
          animationDelay={0.16}
        />
        <MetricCard
          label="Total Sales"
          value={<>$<AnimatedNumber value={metrics?.totalSales ?? 0} decimals={2} formatNumber={true} duration={800} /></>}
          icon="💵"
          animationDelay={0.24}
        />
      </div>

      {/* AI Insights Link */}
      <Card animationDelay={0}>
        <div className="flex items-center justify-between p-4 rounded-[9px]" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">🩸</span>
            <div>
              <h3 className="font-medium" style={{ color: 'var(--accent-primary)' }}>AI Insights & Bleeding Keywords</h3>
              <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>View wasted spend, bleeding keywords, and optimization recommendations</p>
            </div>
          </div>
          <Button onClick={() => onNavigate('insights')} style={{ backgroundColor: 'var(--accent-primary)' }}>
            View Insights →
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="ROAS Trend" animationDelay={0} style={{ transition: 'border-color 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#CBD5E1'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1E3048'}>{chartData?.daily && <ROASChart key={`roas-${dateRange}`} data={chartData.daily} />}</Card>
        <Card title="Spend vs Sales" animationDelay={0.08} style={{ transition: 'border-color 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#CBD5E1'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1E3048'}>{chartData?.daily && <SpendChart key={`spend-${dateRange}`} data={chartData.daily} />}</Card>
        <Card title="Campaign Breakdown" animationDelay={0.16} style={{ transition: 'border-color 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#CBD5E1'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1E3048'}>{chartData?.campaignBreakdown && <CampaignBreakdownChart key={`breakdown-${dateRange}`} data={chartData.campaignBreakdown} />}</Card>
        <Card title="Performance Metrics" animationDelay={0.24}>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-bold" style={{ color: 'var(--text-tertiary)' }}>CTR</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                <AnimatedNumber value={metrics?.ctr || 0} decimals={2} duration={800} />%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold" style={{ color: 'var(--text-tertiary)' }}>Impressions</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                <AnimatedNumber value={metrics?.totalImpressions || 0} decimals={0} formatNumber={true} duration={800} />
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-bold" style={{ color: 'var(--text-tertiary)' }}>Clicks</span>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                <AnimatedNumber value={metrics?.totalClicks || 0} decimals={0} formatNumber={true} duration={800} />
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}