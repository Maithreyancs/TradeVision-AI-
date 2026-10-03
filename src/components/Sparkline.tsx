import React from 'react';

interface SparklineProps {
  data?: number[];
  isPositive?: boolean;
  width?: number;
  height?: number;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data = [],
  isPositive = true,
  width = 100,
  height = 36,
}) => {
  if (!data || data.length < 2) {
    // Generate a subtle flat-to-slight slope fallback if minimal points
    const base = isPositive ? [10, 11, 10, 13, 15, 14, 18] : [18, 17, 15, 16, 12, 13, 10];
    return <Sparkline data={base} isPositive={isPositive} width={width} height={height} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * (width - 4) + 2;
      const y = height - 4 - ((val - min) / range) * (height - 8);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const strokeColor = isPositive ? '#10B981' : '#F43F5E';
  const fillColor = isPositive ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)';

  const firstPt = points.split(' ')[0];
  const lastPt = points.split(' ')[points.split(' ').length - 1];
  const lastX = lastPt.split(',')[0];
  const firstX = firstPt.split(',')[0];
  const areaPoints = `${firstPt} ${points} ${lastX},${height} ${firstX},${height}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${isPositive ? 'pos' : 'neg'}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${isPositive ? 'pos' : 'neg'})`} />
      <polyline fill="none" stroke={strokeColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" points={points} />
    </svg>
  );
};
