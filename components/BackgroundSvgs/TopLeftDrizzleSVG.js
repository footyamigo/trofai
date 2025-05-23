import React from 'react';

const TopLeftDrizzleSVG = ({ fill, style }) => {
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
        <linearGradient id="drizzleGradientTL" x1="0%" y1="0%" x2="50%" y2="50%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.5 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0.05 }} />
        </linearGradient>
         <filter id="drizzleBlurTL" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" />
        </filter>
      </defs>
      <g opacity="0.8" filter="url(#drizzleBlurTL)">
        {[...Array(5)].map((_, i) => {
          const initialX = 50 + i * 40;
          const initialY = -50;
          const length = 200 + Math.random() * 150;
          const angle = 20 + Math.random() * 20; // Slight angle variation
          const width = 15 + Math.random() * 10;
          const duration = 10 + Math.random() * 5;
          const delay = i * 0.5;

          return (
            <ellipse
              key={`drizzle-${i}`}
              cx={initialX}
              cy={initialY + length / 2}
              rx={width / 2}
              ry={length / 2}
              fill="url(#drizzleGradientTL)"
              transform={`rotate(${angle} ${initialX} ${initialY + length / 2})`}
              opacity={0.4 + Math.random() * 0.3}
            >
              <animate 
                attributeName="cy"
                values={`${initialY + length / 2};${initialY + length / 2 + 50};${initialY + length / 2}`}
                dur={`${duration}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
               <animate 
                attributeName="rx"
                values={`${width/2};${width/2 + 5};${width/2}`}
                dur={`${duration * 0.8}s`}
                begin={`${delay}s`}
                repeatCount="indefinite"
              />
            </ellipse>
          );
        })}
      </g>
    </svg>
  );
};

export default TopLeftDrizzleSVG; 