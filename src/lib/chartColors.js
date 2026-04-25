/**
 * Professional Chart Color Palette
 * Theme-aware configuration with VIBRANT colors
 */

export const CHART_COLORS = {
  // Primary palette - 10 distinctive VIBRANT colors
  primary: [
    '#00D9A3', // Vibrant Emerald - positive/growth
    '#4DA3FF', // Bright Blue - primary data
    '#A855F7', // Vivid Purple - secondary data
    '#FFB020', // Bright Amber - warnings/attention
    '#00D4E4', // Bright Cyan - cool data
    '#FF6B9D', // Bright Pink - highlights
    '#00C896', // Teal - alternative positive
    '#FF8C42', // Bright Orange - alerts
    '#7C3AED', // Deep Purple - deep data
    '#A3E635', // Bright Lime - fresh data
  ],

  // Semantic colors - MORE VIBRANT
  semantic: {
    success: '#00D9A3',
    warning: '#FFB020',
    danger: '#FF5757',
    info: '#4DA3FF',
    neutral: '#8B92A8',
  },

  // Gradient pairs for area charts
  gradients: {
    emerald: {
      from: '#00D9A3',
      to: '#00C896',
      stops: [
        { offset: '0%', color: '#00D9A3', opacity: 0.4 },
        { offset: '100%', color: '#00D9A3', opacity: 0 },
      ],
    },
    blue: {
      from: '#4DA3FF',
      to: '#3B82F6',
      stops: [
        { offset: '0%', color: '#4DA3FF', opacity: 0.4 },
        { offset: '100%', color: '#4DA3FF', opacity: 0 },
      ],
    },
    purple: {
      from: '#A855F7',
      to: '#9333EA',
      stops: [
        { offset: '0%', color: '#A855F7', opacity: 0.4 },
        { offset: '100%', color: '#A855F7', opacity: 0 },
      ],
    },
  },
};

/**
 * Get color by index (cycles through palette)
 */
export function getChartColor(index) {
  return CHART_COLORS.primary[index % CHART_COLORS.primary.length];
}

/**
 * Get gradient definition for Recharts
 */
export function getChartGradient(type = 'emerald') {
  return CHART_COLORS.gradients[type] || CHART_COLORS.gradients.emerald;
}

/**
 * Get theme-aware chart configuration
 * Reads CSS variables from the current theme
 */
export function getRechartsTheme() {
  // Get computed CSS variables from root
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);

  const chartGridColor = computedStyle.getPropertyValue('--chart-grid').trim() || '#374151';
  const chartTextColor = computedStyle.getPropertyValue('--chart-text').trim() || '#9CA3AF';
  const tooltipBg = computedStyle.getPropertyValue('--chart-tooltip-bg').trim() || '#1F2937';
  const tooltipBorder = computedStyle.getPropertyValue('--chart-tooltip-border').trim() || '#374151';
  const textPrimary = computedStyle.getPropertyValue('--text-primary').trim() || '#F1F5F9';
  const textSecondary = computedStyle.getPropertyValue('--text-secondary').trim() || '#CBD5E1';

  return {
    // Axis styling
    axis: {
      stroke: chartGridColor,
      fontSize: 12,
      fontFamily: 'Inter, system-ui, sans-serif',
      fill: chartTextColor,
    },

    // Grid styling
    grid: {
      stroke: chartGridColor,
      strokeDasharray: '3 3',
    },

    // Tooltip styling
    tooltip: {
      contentStyle: {
        backgroundColor: tooltipBg,
        border: `1px solid ${tooltipBorder}`,
        borderRadius: '8px',
        padding: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      labelStyle: {
        color: textPrimary,
        fontWeight: 600,
        marginBottom: '8px',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
      },
      itemStyle: {
        color: textSecondary,
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '11px',
      },
    },

    // Legend styling
    legend: {
      iconType: 'square',
      wrapperStyle: {
        paddingTop: '20px',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '12px',
        color: chartTextColor,
      },
    },
  };
}

/**
 * Static Recharts theme configuration (fallback)
 * Use getRechartsTheme() for dynamic theme-aware configuration
 */
export const RECHARTS_THEME = {
  // Axis styling
  axis: {
    stroke: '#374151',
    fontSize: 12,
    fontFamily: 'Inter, system-ui, sans-serif',
    fill: '#9ca3af',
  },

  // Grid styling
  grid: {
    stroke: '#374151',
    strokeDasharray: '3 3',
  },

  // Tooltip styling
  tooltip: {
    contentStyle: {
      backgroundColor: '#111827',
      border: '1px solid #374151',
      borderRadius: '8px',
      padding: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
    },
    labelStyle: {
      color: '#f9fafb',
      fontWeight: 600,
      marginBottom: '8px',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '12px',
    },
    itemStyle: {
      color: '#d1d5db',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '11px',
    },
  },

  // Legend styling
  legend: {
    iconType: 'square',
    wrapperStyle: {
      paddingTop: '20px',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '12px',
    },
  },
};

/**
 * Example usage with Recharts:
 *
 * import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
 * import { CHART_COLORS, getRechartsTheme, getChartColor } from './chartColors';
 *
 * const chartTheme = getRechartsTheme(); // Get theme-aware configuration
 *
 * <LineChart data={data}>
 *   <CartesianGrid {...chartTheme.grid} />
 *   <XAxis {...chartTheme.axis} />
 *   <YAxis {...chartTheme.axis} />
 *   <Tooltip {...chartTheme.tooltip} />
 *   <Legend {...chartTheme.legend} />
 *   <Line type="monotone" dataKey="sales" stroke={getChartColor(0)} strokeWidth={2} />
 *   <Line type="monotone" dataKey="spend" stroke={getChartColor(1)} strokeWidth={2} />
 * </LineChart>
 */
