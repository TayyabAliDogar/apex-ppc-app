// Apex PPC - Professional Business Logo
// Modern, clean design for analytics platform

export function Logo({ size = 40, animated = true }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={animated ? 'logo-animated' : ''}
    >
      <defs>
        {/* Professional gradient - subtle and refined */}
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>

        {/* Accent gradient for depth */}
        <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        {/* Professional shadow */}
        <filter id="softShadow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
          <feOffset dx="0" dy="2" result="offsetblur"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.15"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Rounded square background - modern corporate style */}
      <rect
        x="2"
        y="2"
        width="36"
        height="36"
        rx="8"
        fill="url(#logoGradient)"
        filter="url(#softShadow)"
      />

      {/* Geometric symbol - abstract growth chart/arrow */}
      <g>
        {/* Base platform */}
        <rect
          x="10"
          y="26"
          width="20"
          height="2"
          rx="1"
          fill="#ffffff"
          opacity="0.3"
        />

        {/* Rising bars - data visualization concept */}
        <rect
          x="11"
          y="22"
          width="3"
          height="4"
          rx="1.5"
          fill="#ffffff"
          opacity="0.7"
        >
          {animated && (
            <animate
              attributeName="height"
              values="4;5;4"
              dur="2s"
              repeatCount="indefinite"
            />
          )}
        </rect>

        <rect
          x="16"
          y="18"
          width="3"
          height="8"
          rx="1.5"
          fill="#ffffff"
          opacity="0.85"
        >
          {animated && (
            <animate
              attributeName="height"
              values="8;9;8"
              dur="2s"
              begin="0.3s"
              repeatCount="indefinite"
            />
          )}
        </rect>

        <rect
          x="21"
          y="14"
          width="3"
          height="12"
          rx="1.5"
          fill="#ffffff"
        >
          {animated && (
            <animate
              attributeName="height"
              values="12;13;12"
              dur="2s"
              begin="0.6s"
              repeatCount="indefinite"
            />
          )}
        </rect>

        <rect
          x="26"
          y="10"
          width="3"
          height="16"
          rx="1.5"
          fill="#ffffff"
        >
          {animated && (
            <animate
              attributeName="height"
              values="16;17;16"
              dur="2s"
              begin="0.9s"
              repeatCount="indefinite"
            />
          )}
        </rect>

        {/* Upward arrow - growth indicator */}
        <path
          d="M27.5 8 L27.5 11 M25.5 9.5 L27.5 7.5 L29.5 9.5"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {animated && (
            <animate
              attributeName="opacity"
              values="0.7;1;0.7"
              dur="2s"
              repeatCount="indefinite"
            />
          )}
        </path>
      </g>

      {/* Subtle corner accent - premium detail */}
      <path
        d="M32 6 L34 6 L34 8"
        stroke="url(#accentGradient)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />
    </svg>
  );
}
