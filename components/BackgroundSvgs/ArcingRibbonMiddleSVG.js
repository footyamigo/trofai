import React from 'react';

const ArcingRibbonMiddleSVG = ({ fill, style }) => {
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
        <linearGradient id="ribbonGradientM" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.6 }} />
          <stop offset="50%" style={{ stopColor: fill, stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0.6 }} />
        </linearGradient>
        <filter id="ribbonBlurM" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
        </filter>
      </defs>
      <g opacity="0.7" filter="url(#ribbonBlurM)">
        <path
          d="M -100 400 Q 200 300 400 500 T 700 450 T 900 600 L 900 700 Q 700 550 400 600 T 200 400 T -100 500 Z"
          fill="url(#ribbonGradientM)"
        >
          <animate
            attributeName="d"
            values="
              M -100 400 Q 200 300 400 500 T 700 450 T 900 600 L 900 700 Q 700 550 400 600 T 200 400 T -100 500 Z;
              M -100 450 Q 250 350 450 550 T 750 500 T 900 650 L 900 750 Q 750 600 450 650 T 250 450 T -100 550 Z;
              M -100 400 Q 200 300 400 500 T 700 450 T 900 600 L 900 700 Q 700 550 400 600 T 200 400 T -100 500 Z"
            dur="22s"
            repeatCount="indefinite"
          />
        </path>
      </g>
    </svg>
  );
};

export default ArcingRibbonMiddleSVG; 