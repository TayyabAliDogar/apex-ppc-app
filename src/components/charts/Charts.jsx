// Dashboard Charts Component
// Financial visualization with Recharts
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

// Obsidian & Emerald color palette
const COLORS = {
  emerald: '#10b981',
  emeraldLight: '#34d399',
  red: '#ef4444',
  yellow: '#fbbf24',
  blue: '#3b82f6',
  gray: '#6b7280'
};

export function TrendChart({ data, dataKey, title, color = COLORS.emerald }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#94A3B8]">
        No data available
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ willChange: 'opacity' }}
    >
      {title && <h4 className="text-sm font-medium text-[#94A3B8] mb-4">{title}</h4>}
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f9fafb'
            }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
            animationBegin={300}
            animationDuration={1000}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function SpendChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#94A3B8]">
        No data available
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ willChange: 'opacity' }}
    >
      <h4 className="text-sm font-medium text-[#94A3B8] mb-4">Daily Spend vs Sales</h4>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f9fafb'
            }}
          />
          <Legend
            wrapperStyle={{ color: '#9ca3af', fontSize: '12px' }}
          />
          <Bar
            dataKey="spend"
            fill={COLORS.red}
            name="Spend"
            animationBegin={300}
            animationDuration={800}
            animationEasing="ease-out"
          />
          <Bar
            dataKey="sales"
            fill={COLORS.emerald}
            name="Sales"
            animationBegin={400}
            animationDuration={800}
            animationEasing="ease-out"
          />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function CampaignBreakdownChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#94A3B8]">
        No data available
      </div>
    );
  }

  const CHART_COLORS = [COLORS.emerald, COLORS.blue, COLORS.yellow, COLORS.red, COLORS.gray];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      style={{ willChange: 'opacity, transform' }}
    >
      <h4 className="text-sm font-medium text-[#94A3B8] mb-4">Spend by Campaign</h4>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="35%"
            cy="50%"
            labelLine={false}
            label={false}
            outerRadius={70}
            fill="#8884d8"
            dataKey="value"
            animationBegin={200}
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f9fafb'
            }}
            formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            wrapperStyle={{
              color: '#9ca3af',
              fontSize: '13px',
              lineHeight: '24px',
              paddingLeft: '25px'
            }}
            iconType="circle"
            iconSize={8}
          />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
}

export function ROASChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[#94A3B8]">
        No data available
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{ willChange: 'opacity' }}
    >
      <h4 className="text-sm font-medium text-[#94A3B8] mb-4">ROAS Trend</h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1f2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#f9fafb'
            }}
          />
          <Line
            type="monotone"
            dataKey="roas"
            stroke={COLORS.emerald}
            strokeWidth={2}
            dot={{ fill: COLORS.emerald, r: 4 }}
            activeDot={{ r: 6 }}
            animationBegin={300}
            animationDuration={1000}
            animationEasing="ease-in-out"
          />
          {/* Target ROAS line */}
          <Line
            type="monotone"
            dataKey="target"
            stroke={COLORS.yellow}
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            animationBegin={500}
            animationDuration={800}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </motion.div>
  );
}
