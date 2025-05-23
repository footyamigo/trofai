import React from 'react';

const DotScatterBottomRightSVG = ({ fill, style }) => {
  const dotPositions = [
    { cx: 650, cy: 800, r: 15 },
    { cx: 720, cy: 850, r: 20 },
    { cx: 680, cy: 920, r: 12 },
    { cx: 750, cy: 780, r: 18 },
    { cx: 600, cy: 880, r: 10 },
    { cx: 780, cy: 900, r: 16 },
    { cx: 630, cy: 750, r: 14 },
  ];

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 800 1000"
      preserveAspectRatio="xMidYMid slice"
      style={style}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <radialGradient id="dotScatterGradientBR" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0.4 }} />
        </radialGradient>
      </defs>
      <g opacity="0.7">
        {dotPositions.map((dot, i) => (
          <circle
            key={`dot-scatter-${i}`}
            cx={dot.cx + (Math.random() - 0.5) * 20} // Slight random offset
            cy={dot.cy + (Math.random() - 0.5) * 20}
            r={dot.r}
            fill="url(#dotScatterGradientBR)"
            opacity={0.6 + Math.random() * 0.4} // Random opacity for variation
          />
        ))}
      </g>
    </svg>
  );
};

export default DotScatterBottomRightSVG; 