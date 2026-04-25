import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MetricCard, MetricGrid } from './ui/MetricCard';
import { DashboardCard, CompactCard, DataTableCard } from './ui/DashboardCard';
import { CHART_COLORS, getChartColor, RECHARTS_THEME } from '../lib/chartColors';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ScatterChart, Scatter, ZAxis, PieChart, Pie, Cell } from 'recharts';
import { db, queries, safeParseFloat, safeParseDate, extractDate } from '../lib/db';
import { TrendingUp, TrendingDown, AlertTriangle, Target } from 'lucide-react';
import { AnimatedNumber } from './ui/AnimatedNumber';

/**
 * Performance Command Center
 * Uses REAL data from uploaded CSV reports
 */
export function PerformanceHub() {
  const [metrics, setMetrics] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [topCampaigns, setTopCampaigns] = useState([]);
  const [worstCampaigns, setWorstCampaigns] = useState([]);
  const [budgetData, setBudgetData] = useState(null);
  const [totalBusinessSales, setTotalBusinessSales] = useState('');
  const [tacos, setTacos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quadrantData, setQuadrantData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [cumulativeData, setCumulativeData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load overall metrics
      const metricsData = await queries.calculateTotalMetrics();
      setMetrics(metricsData);

      // Load all campaigns
      const allCampaigns = await db.campaigns.filter(c => !c.deleted).toArray();

      // Calculate daily aggregated data
      const dailyMap = {};
      allCampaigns.forEach(campaign => {
        const rawDate = extractDate(campaign);
        const timestamp = safeParseDate(rawDate);

        if (!isNaN(timestamp)) {
          const dateKey = new Date(timestamp).toISOString().split('T')[0];

          if (!dailyMap[dateKey]) {
            dailyMap[dateKey] = {
              date: dateKey,
              spend: 0,
              sales: 0,
              impressions: 0,
              clicks: 0,
              campaigns: 0
            };
          }

          dailyMap[dateKey].spend += safeParseFloat(campaign.spend);
          dailyMap[dateKey].sales += safeParseFloat(campaign.sales);
          dailyMap[dateKey].impressions += safeParseFloat(campaign.impressions);
          dailyMap[dateKey].clicks += safeParseFloat(campaign.clicks);
          dailyMap[dateKey].campaigns += 1;
        }
      });

      // Convert to array and sort by date
      const dailyArray = Object.values(dailyMap)
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(day => ({
          ...day,
          date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          roas: day.spend > 0 ? (day.sales / day.spend).toFixed(2) : 0,
          acos: day.sales > 0 ? ((day.spend / day.sales) * 100).toFixed(1) : 0
        }));

      setDailyData(dailyArray);

      // Calculate campaign-level aggregates for top/worst performers
      const campaignMap = {};
      allCampaigns.forEach(campaign => {
        const name = campaign.campaignName || 'Unknown Campaign';

        if (!campaignMap[name]) {
          campaignMap[name] = {
            name,
            spend: 0,
            sales: 0,
            impressions: 0,
            clicks: 0,
            days: 0
          };
        }

        campaignMap[name].spend += safeParseFloat(campaign.spend);
        campaignMap[name].sales += safeParseFloat(campaign.sales);
        campaignMap[name].impressions += safeParseFloat(campaign.impressions);
        campaignMap[name].clicks += safeParseFloat(campaign.clicks);
        campaignMap[name].days += 1;
      });

      const campaignArray = Object.values(campaignMap).map(c => ({
        ...c,
        roas: c.spend > 0 ? (c.sales / c.spend).toFixed(2) : 0,
        acos: c.sales > 0 ? ((c.spend / c.sales) * 100).toFixed(1) : 0,
        ctr: c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : 0
      }));

      // Top 5 by ROAS
      const top = campaignArray
        .filter(c => c.spend >= 10) // Minimum $10 spend
        .sort((a, b) => parseFloat(b.roas) - parseFloat(a.roas))
        .slice(0, 5);
      setTopCampaigns(top);

      // Worst 5 by ROAS (but with significant spend)
      const worst = campaignArray
        .filter(c => c.spend >= 10)
        .sort((a, b) => parseFloat(a.roas) - parseFloat(b.roas))
        .slice(0, 5);
      setWorstCampaigns(worst);

      // Budget pacing calculation
      if (dailyArray.length > 0) {
        const totalDays = dailyArray.length;
        const avgDailySpend = metricsData.totalSpend / totalDays;
        const last7Days = dailyArray.slice(-7);
        const last7DaysSpend = last7Days.reduce((sum, day) => sum + day.spend, 0);
        const avgLast7Days = last7DaysSpend / 7;

        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const dayOfMonth = today.getDate();
        const daysRemaining = daysInMonth - dayOfMonth;

        const projectedMonthEnd = metricsData.totalSpend + (avgLast7Days * daysRemaining);

        setBudgetData({
          avgDailySpend,
          avgLast7Days,
          projectedMonthEnd,
          daysRemaining,
          totalDays
        });
      }

      // Prepare Performance Quadrant Matrix data
      const quadrant = campaignArray
        .filter(c => c.spend >= 10)
        .map(c => ({
          name: c.name,
          spend: parseFloat(c.spend.toFixed(2)),
          roas: parseFloat(c.roas),
          sales: parseFloat(c.sales.toFixed(2))
        }));
      setQuadrantData(quadrant);

      // Prepare Campaign Contribution Pie Chart data
      const topSpenders = campaignArray
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 5);

      const topSpendersTotal = topSpenders.reduce((sum, c) => sum + c.spend, 0);
      const othersSpend = metricsData.totalSpend - topSpendersTotal;

      const pieChartData = topSpenders.map(c => ({
        name: c.name, // Full name without truncation
        fullName: c.name, // Keep full name for tooltip
        value: parseFloat(c.spend.toFixed(2)),
        percentage: ((c.spend / metricsData.totalSpend) * 100).toFixed(1)
      }));

      if (othersSpend > 0) {
        pieChartData.push({
          name: 'Others',
          fullName: 'Other Campaigns',
          value: parseFloat(othersSpend.toFixed(2)),
          percentage: ((othersSpend / metricsData.totalSpend) * 100).toFixed(1)
        });
      }
      setPieData(pieChartData);

      // Prepare Cumulative Spend Tracker data
      let cumulativeSpend = 0;
      const cumulative = dailyArray.map(day => {
        cumulativeSpend += day.spend;
        return {
          date: day.date,
          cumulative: parseFloat(cumulativeSpend.toFixed(2)),
          daily: parseFloat(day.spend.toFixed(2))
        };
      });
      setCumulativeData(cumulative);

      setLoading(false);
    } catch (error) {
      console.error('Error loading performance data:', error);
      setLoading(false);
    }
  };

  const calculateTacos = () => {
    const totalSales = parseFloat(totalBusinessSales);
    if (isNaN(totalSales) || totalSales <= 0 || !metrics) {
      alert('Please enter valid total business sales');
      return;
    }

    const tacosValue = (metrics.totalSpend / totalSales) * 100;
    setTacos({
      value: tacosValue.toFixed(2),
      adSales: metrics.totalSales,
      totalSales: totalSales,
      organicSales: totalSales - metrics.totalSales
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)', transition: 'var(--theme-transition)' }}>
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <p style={{ color: 'var(--text-tertiary)' }}>Loading performance data...</p>
        </div>
      </div>
    );
  }

  if (!metrics || metrics.totalSpend === 0) {
    return (
      <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--bg-primary)', transition: 'var(--theme-transition)' }}>
        <div className="max-w-2xl mx-auto text-center py-12">
          <div className="text-6xl mb-4">📤</div>
          <h2 className="text-2xl font-[700] mb-2" style={{ color: 'var(--text-primary)' }}>No Data Available</h2>
          <p className="mb-6" style={{ color: 'var(--text-tertiary)' }}>Upload your Amazon PPC report to see performance insights</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6" style={{ backgroundColor: 'var(--bg-primary)', transition: 'var(--theme-transition)' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-[700] tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Performance Command Center
          </h1>
          <p className="text-sm mt-1 font-mono tracking-wide uppercase" style={{ color: 'var(--text-tertiary)' }}>
            Real-time Campaign Intelligence
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <MetricGrid>
        <MetricCard
          label="Total Ad Spend"
          value={<AnimatedNumber value={metrics.totalSpend} prefix="$" decimals={0} formatNumber={true} duration={800} />}
          trend="neutral"
          animationDelay={0}
        />
        <MetricCard
          label="Total Sales"
          value={<AnimatedNumber value={metrics.totalSales} prefix="$" decimals={0} formatNumber={true} duration={800} />}
          trend="neutral"
          animationDelay={0.08}
        />
        <MetricCard
          label="ROAS"
          value={<AnimatedNumber value={metrics.roas} decimals={2} duration={800} />}
          suffix="x"
          trend={metrics.roas >= 3 ? 'up' : metrics.roas >= 2 ? 'neutral' : 'down'}
          animationDelay={0.16}
        />
        <MetricCard
          label="ACoS"
          value={<AnimatedNumber value={metrics.acos} decimals={1} duration={800} />}
          suffix="%"
          trend={metrics.acos <= 25 ? 'up' : metrics.acos <= 35 ? 'neutral' : 'down'}
          animationDelay={0.24}
        />
      </MetricGrid>

      {/* TACoS Calculator */}
      <DashboardCard title="TACoS Calculator" subtitle="Total Advertising Cost of Sales" variant="accent">
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            TACoS measures ad spend as a percentage of total business revenue (including organic sales)
          </p>

          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs mb-2 font-bold font-mono uppercase" style={{ color: 'var(--text-tertiary)' }}>
                Total Business Sales (Ad + Organic)
              </label>
              <input
                type="number"
                value={totalBusinessSales}
                onChange={(e) => setTotalBusinessSales(e.target.value)}
                placeholder="Enter total sales..."
                className="w-full px-4 py-2 rounded focus:outline-none"
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
            </div>
              <button
                onClick={calculateTacos}
                className="px-6 py-2 text-white rounded font-medium"
                style={{
                  backgroundColor: 'var(--accent-primary)',
                  transition: 'transform 0.1s ease, opacity 0.1s ease, background-color 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.92';
                  e.currentTarget.style.backgroundColor = 'var(--accent-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1';
                  e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = 'scale(0.97)';
                  e.currentTarget.style.opacity = '0.9';
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.opacity = '0.92';
                }}
              >
              Calculate
            </button>
          </div>

          {tacos && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <CompactCard>
                <div className="text-xs font-bold font-mono uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>TACoS</div>
                <div className="text-2xl font-[700] font-mono" style={{ color: 'var(--accent-primary)' }}>
                <AnimatedNumber value={tacos.value} decimals={2} duration={800} />%
                </div>
              </CompactCard>
              <CompactCard>
                <div className="text-xs font-bold font-mono uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>Ad Sales</div>
                <div className="text-xl font-[700] font-mono" style={{ color: 'var(--text-primary)' }}>
                  $<AnimatedNumber value={tacos.adSales} decimals={0} formatNumber={true} duration={800} />
                </div>
              </CompactCard>
              <CompactCard>
                <div className="text-xs font-bold font-mono uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>Organic Sales</div>
                <div className="text-xl font-[700] font-mono" style={{ color: 'var(--text-primary)' }}>
                  $<AnimatedNumber value={tacos.organicSales} decimals={0} formatNumber={true} duration={800} />
                </div>
              </CompactCard>
              <CompactCard>
                <div className="text-xs font-bold font-mono uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>Total Sales</div>
                <div className="text-xl font-[700] font-mono" style={{ color: 'var(--text-primary)' }}>
                  $<AnimatedNumber value={tacos.totalSales} decimals={0} formatNumber={true} duration={800} />
                </div>
              </CompactCard>
            </div>
          )}
        </div>
      </DashboardCard>

      {/* Unique Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Contribution Pie Chart */}
        <DashboardCard title="Budget Allocation" subtitle="Top Campaigns by Spend" variant="elevated">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="35%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getChartColor(index)} />
                ))}
              </Pie>
              <Tooltip
                {...RECHARTS_THEME.tooltip}
                formatter={(value, name, props) => [`$${value.toLocaleString()}`, props.payload.fullName || props.payload.name]}
              />
              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{
                  color: '#9ca3af',
                  fontSize: '10px',
                  lineHeight: '22px',
                  paddingLeft: '25px'
                }}
                iconType="circle"
                iconSize={6}
              />
            </PieChart>
          </ResponsiveContainer>
        </DashboardCard>

        {/* Performance Quadrant Matrix */}
        <DashboardCard title="Campaign Positioning" subtitle="Spend vs ROAS" variant="accent">
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
              <CartesianGrid {...RECHARTS_THEME.grid} />
              <XAxis
                type="number"
                dataKey="spend"
                name="Spend"
                {...RECHARTS_THEME.axis}
                label={{ value: 'Spend ($)', position: 'insideBottom', offset: -5, fill: '#9ca3af' }}
              />
              <YAxis
                type="number"
                dataKey="roas"
                name="ROAS"
                {...RECHARTS_THEME.axis}
                label={{ value: 'ROAS', angle: -90, position: 'insideLeft', fill: '#9ca3af' }}
              />
              <ZAxis type="number" dataKey="sales" range={[50, 400]} />
              <Tooltip
                {...RECHARTS_THEME.tooltip}
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{
                        backgroundColor: '#111827',
                        border: '1px solid #374151',
                        borderRadius: '4px',
                        padding: '12px'
                      }}>
                        <p style={{ color: '#f9fafb', fontWeight: 600, marginBottom: '8px', fontSize: '12px' }}>
                          {data.name}
                        </p>
                        <p style={{ color: '#d1d5db', fontSize: '11px' }}>Spend: ${data.spend}</p>
                        <p style={{ color: '#d1d5db', fontSize: '11px' }}>ROAS: {data.roas}x</p>
                        <p style={{ color: '#d1d5db', fontSize: '11px' }}>Sales: ${data.sales}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter
                name="Campaigns"
                data={quadrantData}
                fill={getChartColor(0)}
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-out"
              />
            </ScatterChart>
          </ResponsiveContainer>
        </DashboardCard>

        {/* Cumulative Spend Tracker */}
        <DashboardCard title="Spend Pacing" subtitle="Cumulative Spend Over Time" variant="default">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={cumulativeData}>
              <CartesianGrid {...RECHARTS_THEME.grid} />
              <XAxis dataKey="date" {...RECHARTS_THEME.axis} />
              <YAxis {...RECHARTS_THEME.axis} />
              <Tooltip {...RECHARTS_THEME.tooltip} />
              <Legend {...RECHARTS_THEME.legend} />
              <Line
                type="monotone"
                dataKey="cumulative"
                stroke={getChartColor(0)}
                strokeWidth={3}
                dot={{ fill: getChartColor(0), r: 4 }}
                name="Cumulative Spend"
                animationBegin={0}
                animationDuration={1200}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </DashboardCard>
      </div>

      {/* ROAS & ACoS Trends */}
      <div className="grid grid-cols-1 gap-6">
        <DashboardCard title="ROAS & ACoS Trends" subtitle="Performance Metrics Over Time" variant="accent">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid {...RECHARTS_THEME.grid} />
              <XAxis dataKey="date" {...RECHARTS_THEME.axis} />
              <YAxis {...RECHARTS_THEME.axis} />
              <Tooltip {...RECHARTS_THEME.tooltip} />
              <Legend {...RECHARTS_THEME.legend} />
              <Line
                type="monotone"
                dataKey="roas"
                stroke={getChartColor(0)}
                strokeWidth={2}
                dot={{ fill: getChartColor(0), r: 4 }}
                name="ROAS"
                animationBegin={0}
                animationDuration={1000}
                animationEasing="ease-in-out"
              />
              <Line
                type="monotone"
                dataKey="acos"
                stroke={getChartColor(3)}
                strokeWidth={2}
                dot={{ fill: getChartColor(3), r: 4 }}
                name="ACoS %"
                animationBegin={100}
                animationDuration={1000}
                animationEasing="ease-in-out"
              />
            </LineChart>
          </ResponsiveContainer>
        </DashboardCard>
      </div>

      {/* Budget Pacing */}
      {budgetData && (
        <DashboardCard title="Budget Pacing Tracker" subtitle="Spend Analysis" variant="default">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CompactCard>
              <div className="text-xs font-bold font-mono uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>Avg Daily Spend</div>
              <div className="text-2xl font-[700] font-mono" style={{ color: 'var(--text-primary)' }}>
                $<AnimatedNumber value={budgetData.avgDailySpend} decimals={2} duration={800} />
              </div>
            </CompactCard>
            <CompactCard>
              <div className="text-xs font-bold font-mono uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>Last 7 Days Avg</div>
              <div className="text-2xl font-[700] font-mono" style={{ color: 'var(--text-primary)' }}>
                $<AnimatedNumber value={budgetData.avgLast7Days} decimals={2} duration={800} />
              </div>
            </CompactCard>
            <CompactCard>
              <div className="text-xs font-bold font-mono uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>Projected Month-End</div>
              <div className="text-2xl font-[700] font-mono" style={{ color: 'var(--accent-primary)' }}>
                $<AnimatedNumber value={budgetData.projectedMonthEnd} decimals={0} formatNumber={true} duration={800} />
              </div>
            </CompactCard>
            <CompactCard>
              <div className="text-xs font-bold font-mono uppercase mb-1" style={{ color: 'var(--text-tertiary)' }}>Days Remaining</div>
              <div className="text-2xl font-[700] font-mono" style={{ color: 'var(--text-primary)' }}>
                <AnimatedNumber value={budgetData.daysRemaining} decimals={0} duration={800} />
              </div>
            </CompactCard>
          </div>
        </DashboardCard>
      )}

      {/* Campaign Performance Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <DataTableCard title="Top Performing Campaigns">
          <table className="min-w-full">
            <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  Campaign
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  ROAS
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  Spend
                </th>
              </tr>
            </thead>
            <tbody style={{ borderTop: '1px solid var(--border-primary)' }}>
              {topCampaigns.map((campaign, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid var(--border-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td className="px-6 py-4 text-sm max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                    {campaign.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-mono font-medium" style={{ color: 'var(--accent-primary)' }}>
                    {campaign.roas}x
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                    ${campaign.spend.toFixed(2)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </DataTableCard>

        {/* Worst Performers */}
        <DataTableCard title="Needs Attention">
          <table className="min-w-full">
            <thead style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  Campaign
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  ROAS
                </th>
                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider font-mono" style={{ color: 'var(--text-tertiary)' }}>
                  Spend
                </th>
              </tr>
            </thead>
            <tbody style={{ borderTop: '1px solid var(--border-primary)' }}>
              {worstCampaigns.map((campaign, index) => (
                <motion.tr
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.3 }}
                  className="transition-colors"
                  style={{ borderBottom: '1px solid var(--border-primary)' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td className="px-6 py-4 text-sm max-w-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                    {campaign.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-mono font-medium" style={{ color: 'var(--error)' }}>
                    {campaign.roas}x
                  </td>
                  <td className="px-6 py-4 text-sm text-right font-mono" style={{ color: 'var(--text-secondary)' }}>
                    ${campaign.spend.toFixed(2)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </DataTableCard>
      </div>
    </div>
  );
}
