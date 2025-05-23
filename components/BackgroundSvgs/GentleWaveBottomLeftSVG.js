import React from 'react';

const GentleWaveBottomLeftSVG = ({ fill, style }) => {
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
        <linearGradient id="waveGradientBL" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.6 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0.1 }} />
        </linearGradient>
        <filter id="waveBlurBL" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="25" />
        </filter>
      </defs>
      <g opacity="0.7" filter="url(#waveBlurBL)">
        <path
          d="M -100 800 Q 100 700 300 850 T 700 800 L 850 1050 L -100 1050 Z"
          fill="url(#waveGradientBL)"
        >
          <animate
            attributeName="d"
            values="M -100 800 Q 100 700 300 850 T 700 800 L 850 1050 L -100 1050 Z; M -100 800 Q 150 750 350 800 T 750 850 L 850 1050 L -100 1050 Z; M -100 800 Q 100 700 300 850 T 700 800 L 850 1050 L -100 1050 Z"
            dur="18s"
            repeatCount="indefinite"
          />
        </path>
        <path
          d="M -150 900 Q 50 800 250 950 T 650 900 L 800 1100 L -150 1100 Z"
          fill="url(#waveGradientBL)"
          opacity="0.7"
        >
          <animate
            attributeName="d"
            values="M -150 900 Q 50 800 250 950 T 650 900 L 800 1100 L -150 1100 Z; M -150 900 Q 100 850 300 900 T 700 950 L 800 1100 L -150 1100 Z; M -150 900 Q 50 800 250 950 T 650 900 L 800 1100 L -150 1100 Z"
            dur="20s"
            begin="-3s"
            repeatCount="indefinite"
          />
        </path>
      </g>
    </svg>
  );
};

export default GentleWaveBottomLeftSVG; 