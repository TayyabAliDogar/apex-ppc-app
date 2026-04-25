import { useEffect, useState, useRef } from 'react';

/**
 * Animated Number Counter Component
 * Counts up from 0 to target value with smooth easing
 */
export function AnimatedNumber({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatNumber = false
}) {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef(null);

  useEffect(() => {
    // Parse the value (handle strings like "$1,234.56" or "25.5%")
    const numericValue = typeof value === 'string'
      ? parseFloat(value.replace(/[^0-9.-]/g, ''))
      : parseFloat(value);

    if (isNaN(numericValue)) {
      setDisplayValue(0);
      return;
    }

    let startTime;
    const startValue = 0;
    const endValue = numericValue;

    const animate = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Ease-out quad for smooth deceleration
      const easeOutQuad = progress * (2 - progress);
      const currentValue = startValue + (endValue - startValue) * easeOutQuad;

      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayValue(endValue);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  const formatDisplayValue = () => {
    if (formatNumber) {
      return displayValue.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
    }
    return displayValue.toFixed(decimals);
  };

  return (
    <span>
      {prefix}
      {formatDisplayValue()}
      {suffix}
    </span>
  );
}
