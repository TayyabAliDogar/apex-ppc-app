import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * Premium Metric Card Component
 * Enhanced with vibrant colors and depth
 */
export function MetricCard({
  label,
  value,
  change,
  trend = 'neutral',
  sparklineData = [],
  prefix = '',
  suffix = '',
  className = ''
}) {
  const trendColors = {
    up: 'var(--success)',
    down: 'var(--error)',
    neutral: 'var(--text-tertiary)'
  };

  const trendBgColors = {
    up: { backgroundColor: 'rgba(0, 217, 163, 0.15)', border: '1px solid rgba(0, 217, 163, 0.4)' },
    down: { backgroundColor: 'rgba(255, 87, 87, 0.15)', border: '1px solid rgba(255, 87, 87, 0.4)' },
    neutral: { backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative ${className}`}
    >
      <div
        className="relative rounded-[12px] transition-all duration-300 overflow-hidden"
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--shadow-sm)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          e.currentTarget.style.borderColor = 'var(--accent-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          e.currentTarget.style.borderColor = 'var(--card-border)';
        }}
      >
        {/* Premium top accent bar */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(to right, transparent, var(--accent-primary), transparent)' }}
        />

        <div className="p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold tracking-wider uppercase font-mono" style={{ color: 'var(--text-tertiary)' }}>
              {label}
            </span>

            {change !== undefined && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.3 }}
                className="flex items-center gap-1 px-2 py-1 rounded-md"
                style={trendBgColors[trend]}
              >
                <TrendIcon className="w-3 h-3" style={{ color: trendColors[trend] }} />
                <span className="text-xs font-bold font-mono" style={{ color: trendColors[trend] }}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
              </motion.div>
            )}
          </div>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-4"
          >
            <div
              className="text-4xl font-[700] tracking-tight font-mono"
              style={{
                color: 'var(--text-primary)',
                textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
            >
              {prefix}{value}{suffix}
            </div>
          </motion.div>

          {sparklineData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scaleX: 0.8 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="h-12 relative"
            >
              <svg className="w-full h-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`gradient-${label}`} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path
                  d={generateSparklinePath(sparklineData, true)}
                  fill={`url(#gradient-${label})`}
                  className="transition-all duration-500"
                />

                <path
                  d={generateSparklinePath(sparklineData, false)}
                  fill="none"
                  stroke="var(--accent-primary)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-500"
                />
              </svg>
            </motion.div>
          )}
        </div>

        {/* Premium bottom accent bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(to right, transparent, var(--accent-primary), transparent)' }}
        />

        {/* Subtle glow effect on hover */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 50%, var(--accent-primary), transparent 70%)' }}
        />
      </div>
    </motion.div>
  );
}

function generateSparklinePath(data, isArea = false) {
  if (data.length === 0) return '';

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  });

  if (isArea) {
    return `M 0,100 L ${points.join(' L ')} L 100,100 Z`;
  } else {
    return `M ${points.join(' L ')}`;
  }
}

export function MetricGrid({ children, className = '' }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {children}
    </div>
  );
}
