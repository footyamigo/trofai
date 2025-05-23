import React from 'react';

const RightEdgeSwirlSVG = ({ fill, style }) => {
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
        <linearGradient id="swirlGradientRE" x1="100%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.6 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0.1 }} />
        </linearGradient>
        <filter id="swirlBlurRE" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="25" />
        </filter>
      </defs>
      <g opacity="0.75" filter="url(#swirlBlurRE)">
        <path
          d="M 800 0 C 700 200 750 300 800 500 S 700 800 800 1000 L 850 1000 C 850 800 800 700 850 500 S 800 200 850 0 Z"
          fill="url(#swirlGradientRE)"
        >
          <animate
            attributeName="d"
            values="
              M 800 0 C 700 200 750 300 800 500 S 700 800 800 1000 L 850 1000 C 850 800 800 700 850 500 S 800 200 850 0 Z;
              M 800 0 C 650 250 700 350 800 550 S 650 750 800 1000 L 850 1000 C 850 750 750 650 850 500 S 750 250 850 0 Z;
              M 800 0 C 700 200 750 300 800 500 S 700 800 800 1000 L 850 1000 C 850 800 800 700 850 500 S 800 200 850 0 Z"
            dur="20s"
            repeatCount="indefinite"
          />
        </path>
      </g>
    </svg>
  );
};

export default RightEdgeSwirlSVG; 