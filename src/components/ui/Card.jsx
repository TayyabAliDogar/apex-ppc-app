// Premium Card Component - Enhanced Design
import { motion } from 'framer-motion';

export function Card({ title, subtitle, children, actions, className = '', animationDelay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: animationDelay }}
      className={`p-6 relative overflow-hidden group ${className}`}
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.borderColor = 'var(--border-hover)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        e.currentTarget.style.borderColor = 'var(--card-border)';
      }}
    >
      {/* Premium top accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'linear-gradient(to right, transparent, var(--accent-primary), transparent)' }}
      />

      {(title || subtitle || actions) && (
        <div className="mb-4 flex items-start justify-between">
          <div>
            {title && (
              <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm mt-1 font-semibold" style={{ color: 'var(--text-tertiary)' }}>{subtitle}</p>
            )}
          </div>
          {actions && (
            <div className="flex gap-2">{actions}</div>
          )}
        </div>
      )}
      {children}

      {/* Subtle glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 50%, var(--accent-primary), transparent 70%)' }}
      />
    </motion.div>
  );
}

// Premium Metric Card Component
export function MetricCard({ label, value, change, trend, format = 'text', icon, animationDelay = 0 }) {
  const trendColor = trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--error)' : 'var(--text-tertiary)';
  const TrendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: animationDelay }}
      className="p-5 relative overflow-hidden group"
      style={{
        backgroundColor: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-sm)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
      {/* Premium accent bar */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: 'linear-gradient(to right, transparent, var(--accent-primary), transparent)' }}
      />

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase font-bold" style={{ color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}>{label}</span>
        {icon && <span className="text-xl" style={{ color: 'var(--text-tertiary)' }}>{icon}</span>}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl text-metric font-[700]" style={{ color: 'var(--text-primary)', textShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          {value}
        </span>
        {change && (
          <span className="flex items-center text-sm font-bold px-2 py-1 rounded-md" style={{ color: trendColor, backgroundColor: trend === 'up' ? 'rgba(0, 217, 163, 0.15)' : trend === 'down' ? 'rgba(255, 87, 87, 0.15)' : 'transparent' }}>
            <span className="mr-1">{TrendIcon}</span>
            {Math.abs(change)}%
          </span>
        )}
      </div>

      {/* Subtle glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none"
        style={{ background: 'radial-gradient(circle at 50% 50%, var(--accent-primary), transparent 70%)' }}
      />
    </motion.div>
  );
}

