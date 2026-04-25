import { motion } from 'framer-motion';

/**
 * Premium Dashboard Card Component
 * Enhanced with vibrant colors and depth
 */
export function DashboardCard({
  title,
  subtitle,
  children,
  action,
  className = '',
  variant = 'default' // 'default', 'elevated', 'accent'
}) {
  const variants = {
    default: {
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      boxShadow: 'var(--shadow-sm)'
    },
    elevated: {
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--card-border)',
      boxShadow: 'var(--shadow-md)'
    },
    accent: {
      backgroundColor: 'var(--card-bg)',
      border: '1px solid var(--accent-primary)',
      boxShadow: 'var(--glow-primary), var(--shadow-md)'
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`group relative ${className}`}
    >
      {/* Card Container */}
      <div
        className="relative transition-all duration-300 rounded-[12px] overflow-hidden"
        style={variants[variant]}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = variant === 'accent'
            ? 'var(--glow-accent), var(--shadow-lg)'
            : 'var(--shadow-lg)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = variants[variant].boxShadow;
        }}
      >
        {/* Premium corner accents */}
        <div
          className="absolute top-0 left-0 w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            borderTop: '2px solid var(--accent-primary)',
            borderLeft: '2px solid var(--accent-primary)',
            borderTopLeftRadius: '12px'
          }}
        />
        <div
          className="absolute bottom-0 right-0 w-12 h-12 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            borderBottom: '2px solid var(--accent-primary)',
            borderRight: '2px solid var(--accent-primary)',
            borderBottomRightRadius: '12px'
          }}
        />

        {/* Header */}
        {(title || action) && (
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
            <div>
              {title && (
                <h3 className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs mt-1 font-bold font-mono tracking-wide uppercase" style={{ color: 'var(--text-tertiary)' }}>
                  {subtitle}
                </p>
              )}
            </div>
            {action && (
              <div className="flex items-center gap-2">
                {action}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Premium hover glow effect */}
        <div
          className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 50% 50%, var(--accent-primary), transparent 70%)' }}
        />
      </div>
    </motion.div>
  );
}

/**
 * Compact Card Variant - Enhanced
 */
export function CompactCard({ children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`group relative ${className}`}
    >
      <div
        className="relative p-4 transition-all duration-300 rounded-[12px]"
        style={{
          backgroundColor: 'var(--card-bg)',
          border: '1px solid var(--card-border)',
          boxShadow: 'var(--shadow-sm)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(to right, transparent, var(--accent-primary), transparent)' }}
        />

        {children}
      </div>
    </motion.div>
  );
}

/**
 * Data Table Card - Enhanced
 */
export function DataTableCard({ title, children, className = '' }) {
  return (
    <DashboardCard title={title} className={className} variant="default">
      <div className="overflow-x-auto -mx-6 -mb-6">
        <div className="inline-block min-w-full align-middle">
          {children}
        </div>
      </div>
    </DashboardCard>
  );
}
