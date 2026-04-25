import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from './ui/Card';
import { db, queries, getMaxDateFromData } from '../lib/db';
import { queryWithHealthCheck } from '../lib/query-health';

export function Analytics() {
  const[chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const[dateRange, setDateRange] = useState('all'); // FIXED: Default to 'all' to show old CSV data

  useEffect(() => {
    loadAnalyticsData();
  }, [dateRange]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // Wait for DB to be ready
      if (!db.isOpen()) {
        await db.open();
      }

      // Get max date from uploaded data (not current date)
      const maxDate = await getMaxDateFromData();

      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : null;
      const startDate = days ? maxDate - (days * 24 * 60 * 60 * 1000) : 0; // 0 means beginning of time
      const endDate = maxDate;

      // Query with health check — dateRange passed for accurate comparison
      const campaigns = await queryWithHealthCheck(
        async () => await queries.getCampaignsByDateRange(startDate, endDate),
        'Analytics.getCampaignsByDateRange',
        { startDate, endDate }
      );

      // Group by date for line chart
      const dailyData = groupByDate(campaigns);

      // Top campaigns with date filtering
      const topCampaigns = await queryWithHealthCheck(
        async () => await queries.getTopCampaigns(10, startDate, endDate),
        'Analytics.getTopCampaigns'
      );

      // Aggregate campaigns by name (sum spend/sales across all dates)
      const campaignMap = {};
      topCampaigns.forEach(c => {
        const name = c?.campaignName || 'Unknown';
        if (!campaignMap[name]) {
          campaignMap[name] = { name, spend: 0, sales: 0 };
        }
        campaignMap[name].spend += (c?.spend ?? 0);
        campaignMap[name].sales += (c?.sales ?? 0);
      });

      // Calculate ACoS from aggregated totals and get unique campaigns
      const uniqueCampaigns = Object.values(campaignMap)
        .map(c => ({
          ...c,
          acos: c.sales > 0 ? (c.spend / c.sales) * 100 : 0
        }))
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 10);

      const campaignACoS = uniqueCampaigns.map(c => {
        const shortName = c.name.substring(0, 20) + (c.name.length > 20 ? '...' : '');
        return {
          name: shortName,
          acos: c.acos,
          spend: c.spend
        };
      });

      setChartData({
        daily: dailyData,
        campaignACoS
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const groupByDate = (campaigns) => {
    const grouped = {};

    campaigns.forEach(c => {
      const date = new Date(c?.date ?? Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!grouped[date]) {
        grouped[date] = { date, spend: 0, sales: 0 };
      }
      grouped[date].spend += (c?.spend ?? 0);
      grouped[date].sales += (c?.sales ?? 0);
    });

    return Object.values(grouped).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-transparent rounded-[4px] animate-spin mx-auto mb-4" style={{ borderColor: 'var(--accent-primary)' }}></div>
          <p style={{ color: 'var(--text-tertiary)' }}>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!chartData || !chartData.daily || chartData.daily.length === 0) {
    return (
      <Card>
        <div className="text-center py-8">
          <p style={{ color: 'var(--text-tertiary)' }}>No data available. Upload a report to see analytics.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex gap-2">
        {['7d', '30d', '90d', 'all'].map(range => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className="px-4 py-2 rounded-[9px] text-sm font-medium transition-colors"
            style={{
              backgroundColor: dateRange === range ? 'var(--accent-primary)' : 'var(--bg-secondary)',
              color: dateRange === range ? '#FFFFFF' : 'var(--text-primary)',
              border: dateRange === range ? 'none' : '1px solid var(--border-primary)'
            }}
          >
            {range === '7d' ? 'Last 7 Days' : range === '30d' ? 'Last 30 Days' : range === '90d' ? 'Last 90 Days' : 'All Time'}
          </button>
        ))}
      </div>

      {/* Sales vs Spend Line Chart */}
      <Card title="Sales vs Spend Trend" animationDelay={0} style={{ transition: 'border-color 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#CBD5E1'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1E3048'}>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData.daily}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${value.toLocaleString()}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f9fafb'
              }}
              formatter={(value) => `$${value.toFixed(2)}`}
            />
            <Legend
              wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }}
            />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 5 }}
              activeDot={{ r: 7 }}
              name="Sales"
            />
            <Line
              type="monotone"
              dataKey="spend"
              stroke="#ef4444"
              strokeWidth={3}
              dot={{ fill: '#ef4444', r: 5 }}
              activeDot={{ r: 7 }}
              name="Spend"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* ACoS by Campaign Bar Chart */}
      <Card title="ACoS by Top Campaigns" animationDelay={0.08} style={{ transition: 'border-color 0.2s ease' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#CBD5E1'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#1E3048'}>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData.campaignACoS}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              stroke="#9ca3af"
              style={{ fontSize: '11px' }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f9fafb'
              }}
              formatter={(value, name) => {
                if (name === 'acos') return [`${value.toFixed(1)}%`, 'ACoS'];
                if (name === 'spend') return [`$${value.toFixed(2)}`, 'Spend'];
                return value;
              }}
            />
            <Legend
              wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }}
            />
            <Bar dataKey="acos" fill="#10b981" name="ACoS %" />
          </BarChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}