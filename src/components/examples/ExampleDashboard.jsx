import { MetricCard, MetricGrid } from '../ui/MetricCard';
import { DashboardCard, CompactCard, DataTableCard } from '../ui/DashboardCard';
import { CHART_COLORS, getChartColor, RECHARTS_THEME } from '../../lib/chartColors';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Example Dashboard using new distinctive components
 * Financial Terminal aesthetic - sharp, precise, data-focused
 */
export function ExampleDashboard() {
  // Sample data
  const metrics = [
    {
      label: 'Total Ad Spend',
      value: '$45,231',
      change: 12.5,
      trend: 'up',
      sparklineData: [30, 35, 32, 38, 42, 45, 48, 52, 49, 55],
    },
    {
      label: 'ROAS',
      value: '3.8',
      change: 8.2,
      trend: 'up',
      sparklineData: [3.2, 3.4, 3.3, 3.5, 3.6, 3.7, 3.8, 3.9, 3.8, 3.8],
      suffix: 'x',
    },
    {
      label: 'ACoS',
      value: '26.3',
      change: -4.1,
      trend: 'down',
      sparklineData: [30, 29, 28, 27, 27, 26, 26, 25, 26, 26],
      suffix: '%',
    },
    {
      label: 'Total Sales',
      value: '$172,458',
      change: 15.8,
      trend: 'up',
      sparklineData: [140, 145, 150, 155, 160, 165, 168, 170, 172, 172],
    },
  ];

  const chartData = [
    { date: 'Jan 15', spend: 4200, sales: 15800, roas: 3.76 },
    { date: 'Jan 16', spend: 4500, sales: 17100, roas: 3.80 },
    { date: 'Jan 17', spend: 4100, sales: 15580, roas: 3.80 },
    { date: 'Jan 18', spend: 4800, sales: 18240, roas: 3.80 },
    { date: 'Jan 19', spend: 5200, sales: 19760, roas: 3.80 },
    { date: 'Jan 20', spend: 4900, sales: 18620, roas: 3.80 },
  ];

  return (
    <div className="min-h-screen bg-obsidian-950 p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-[700] text-obsidian-800 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-[#94A3B8] mt-1 font-mono tracking-wide uppercase">
            Amazon PPC Analytics
          </p>
        </div>
        <button className="px-4 py-2 bg-[#10B981] hover:bg-[#059669] text-white rounded font-medium transition-colors">
          Export Report
        </button>
      </div>

      {/* Metrics Grid */}
      <MetricGrid>
        {metrics.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </MetricGrid>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend vs Sales Chart */}
        <DashboardCard
          title="Spend vs Sales"
          subtitle="Last 7 Days"
          variant="elevated"
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={getChartColor(1)} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={getChartColor(1)} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={getChartColor(0)} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={getChartColor(0)} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...RECHARTS_THEME.grid} />
              <XAxis dataKey="date" {...RECHARTS_THEME.axis} />
              <YAxis {...RECHARTS_THEME.axis} />
              <Tooltip {...RECHARTS_THEME.tooltip} />
              <Legend {...RECHARTS_THEME.legend} />
              <Line
                type="monotone"
                dataKey="spend"
                stroke={getChartColor(1)}
                strokeWidth={2}
                dot={{ fill: getChartColor(1), r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="sales"
                stroke={getChartColor(0)}
                strokeWidth={2}
                dot={{ fill: getChartColor(0), r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </DashboardCard>

        {/* ROAS Trend */}
        <DashboardCard
          title="ROAS Trend"
          subtitle="Target: 3.5x"
          variant="accent"
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid {...RECHARTS_THEME.grid} />
              <XAxis dataKey="date" {...RECHARTS_THEME.axis} />
              <YAxis {...RECHARTS_THEME.axis} />
              <Tooltip {...RECHARTS_THEME.tooltip} />
              <Line
                type="monotone"
                dataKey="roas"
                stroke={getChartColor(0)}
                strokeWidth={3}
                dot={{ fill: getChartColor(0), r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </DashboardCard>
      </div>

      {/* Compact Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CompactCard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#94A3B8] font-mono uppercase tracking-wider mb-1">
                Active Campaigns
              </div>
              <div className="text-2xl font-[700] text-obsidian-800 font-mono">
                24
              </div>
            </div>
            <div className="w-12 h-12 bg-[#10B981]/10 rounded flex items-center justify-center">
              <span className="text-emerald-400 text-xl">📊</span>
            </div>
          </div>
        </CompactCard>

        <CompactCard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#94A3B8] font-mono uppercase tracking-wider mb-1">
                Avg. CPC
              </div>
              <div className="text-2xl font-[700] text-obsidian-800 font-mono">
                $0.87
              </div>
            </div>
            <div className="w-12 h-12 bg-blue-500/10 rounded flex items-center justify-center">
              <span className="text-blue-400 text-xl">💰</span>
            </div>
          </div>
        </CompactCard>

        <CompactCard>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-[#94A3B8] font-mono uppercase tracking-wider mb-1">
                Conversion Rate
              </div>
              <div className="text-2xl font-[700] text-obsidian-800 font-mono">
                12.4%
              </div>
            </div>
            <div className="w-12 h-12 bg-purple-500/10 rounded flex items-center justify-center">
              <span className="text-purple-400 text-xl">🎯</span>
            </div>
          </div>
        </CompactCard>
      </div>

      {/* Data Table Example */}
      <DataTableCard title="Top Performing Campaigns">
        <table className="min-w-full">
          <thead className="bg-[#0D1826] border-b border-obsidian-300">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#94A3B8] uppercase tracking-wider font-mono">
                Campaign
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#94A3B8] uppercase tracking-wider font-mono">
                Spend
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#94A3B8] uppercase tracking-wider font-mono">
                Sales
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-[#94A3B8] uppercase tracking-wider font-mono">
                ROAS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-obsidian-800">
            {[
              { name: 'Premium Coffee Beans', spend: '$1,234', sales: '$4,567', roas: '3.7x' },
              { name: 'Yoga Mat Pro', spend: '$987', sales: '$3,456', roas: '3.5x' },
              { name: 'LED Desk Lamp', spend: '$765', sales: '$2,678', roas: '3.5x' },
            ].map((row, index) => (
              <tr key={index} className="hover:bg-[#0D1826]/50 transition-colors">
                <td className="px-6 py-4 text-sm text-[#F1F5F9]">{row.name}</td>
                <td className="px-6 py-4 text-sm text-[#F1F5F9] text-right font-mono">{row.spend}</td>
                <td className="px-6 py-4 text-sm text-[#F1F5F9] text-right font-mono">{row.sales}</td>
                <td className="px-6 py-4 text-sm text-emerald-400 text-right font-mono font-medium">{row.roas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableCard>
    </div>
  );
}
