import React from 'react';

const FloatingDotsLeftEdgeSVG = ({ fill, style }) => {
  const dotData = [
    { cy: 200, r: 25, delay: 0 },
    { cy: 350, r: 18, delay: 0.5 },
    { cy: 500, r: 30, delay: 0.2 },
    { cy: 650, r: 22, delay: 0.7 },
    { cy: 800, r: 28, delay: 0.4 },
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
        <radialGradient id="leftEdgeDotGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.7 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0.2 }} />
        </radialGradient>
      </defs>
      <g opacity="0.65">
        {dotData.map((dot, i) => (
          <circle
            key={`ledge-dot-${i}`}
            cx="50" // Positioned near the left edge
            cy={dot.cy}
            r={dot.r}
            fill="url(#leftEdgeDotGradient)"
            opacity={0.5 + Math.random() * 0.4}
          >
            <animate 
              attributeName="cx"
              values="50;70;50"
              dur="8s"
              begin={`${dot.delay}s`}
              repeatCount="indefinite"
            />
            <animate 
              attributeName="r"
              values={`${dot.r};${dot.r * 1.2};${dot.r}`}
              dur="10s"
              begin={`${dot.delay + 0.5}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}
      </g>
    </svg>
  );
};

export default FloatingDotsLeftEdgeSVG; 