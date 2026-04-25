// Premium Button Component - Enhanced Design
export function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const baseStyles = 'relative overflow-hidden transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-bold shadow-sm hover:shadow-md active:shadow-sm';

  const variants = {
    primary: 'text-white focus:ring-emerald-500',
    secondary: 'text-white focus:ring-indigo-500',
    danger: 'focus:ring-red-500',
    ghost: 'bg-transparent focus:ring-obsidian-300',
    outline: 'bg-transparent',
    backup: 'text-white focus:ring-emerald-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-base',
    lg: 'px-7 py-3.5 text-lg'
  };

  const getBackgroundColor = () => {
    if (variant === 'primary') return 'var(--accent-primary)';
    if (variant === 'secondary') return '#6366F1';
    if (variant === 'backup') return 'var(--accent-primary)';
    if (variant === 'danger') return '#FF5757';
    if (variant === 'outline') return 'transparent';
    if (variant === 'ghost') return 'transparent';
    return undefined;
  };

  const getHoverColor = () => {
    if (variant === 'primary') return 'var(--accent-hover)';
    if (variant === 'secondary') return '#4F46E5';
    if (variant === 'backup') return 'var(--accent-hover)';
    if (variant === 'danger') return '#EF4444';
    return undefined;
  };

  const getBorderStyle = () => {
    if (variant === 'outline') return '2px solid var(--border-secondary)';
    if (variant === 'danger') return 'none';
    return 'none';
  };

  const getTextColor = () => {
    if (variant === 'outline') return 'var(--text-primary)';
    if (variant === 'ghost') return 'var(--text-secondary)';
    return '#FFFFFF';
  };

  const getShadow = () => {
    if (variant === 'primary' || variant === 'backup') return 'var(--shadow-sm)';
    if (variant === 'secondary') return '0 2px 8px rgba(99, 102, 241, 0.3)';
    if (variant === 'danger') return '0 2px 8px rgba(255, 87, 87, 0.3)';
    return 'none';
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      style={{
        backgroundColor: getBackgroundColor(),
        border: getBorderStyle(),
        color: getTextColor(),
        borderRadius: '12px',
        boxShadow: getShadow(),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontWeight: '600'
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = variant === 'primary' || variant === 'backup'
            ? 'var(--glow-primary), var(--shadow-md)'
            : variant === 'secondary'
            ? '0 4px 16px rgba(99, 102, 241, 0.4)'
            : variant === 'danger'
            ? '0 4px 16px rgba(255, 87, 87, 0.4)'
            : 'var(--shadow-md)';
          if (getHoverColor()) {
            e.currentTarget.style.backgroundColor = getHoverColor();
          }
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = getShadow();
          e.currentTarget.style.backgroundColor = getBackgroundColor();
        }
      }}
      onMouseDown={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(0) scale(0.98)';
        }
      }}
      onMouseUp={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
        }
      }}
      disabled={loading || disabled}
      {...props}
    >
      {/* Premium ripple effect overlay */}
      <span
        className="absolute inset-0 opacity-0 hover:opacity-10 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'radial-gradient(circle, white 10%, transparent 10.01%)' }}
      />

      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {children}
        </span>
      ) : (
        <span className="relative z-10">{children}</span>
      )}
    </button>
  );
}
