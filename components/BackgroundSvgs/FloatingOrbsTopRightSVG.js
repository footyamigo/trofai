import React from 'react';

const FloatingOrbsTopRightSVG = ({ fill, style }) => {
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
        <radialGradient id="orbGradientTR" cx="50%" cy="50%" r="70%" fx="30%" fy="30%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.7 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0.1 }} />
        </radialGradient>
        <filter id="orbBlurTR" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
        </filter>
      </defs>
      <g opacity="0.8" filter="url(#orbBlurTR)">
        <circle cx="700" cy="150" r="120" fill="url(#orbGradientTR)" opacity="0.6">
          <animate attributeName="cx" values="700;720;700" dur="10s" repeatCount="indefinite" />
          <animate attributeName="cy" values="150;130;150" dur="12s" repeatCount="indefinite" />
        </circle>
        <circle cx="600" cy="250" r="90" fill="url(#orbGradientTR)" opacity="0.5">
          <animate attributeName="cx" values="600;580;600" dur="11s" begin="-2s" repeatCount="indefinite" />
          <animate attributeName="cy" values="250;270;250" dur="9s" begin="-2s" repeatCount="indefinite" />
        </circle>
        <circle cx="750" cy="300" r="70" fill="url(#orbGradientTR)" opacity="0.4">
          <animate attributeName="cx" values="750;730;750" dur="9s" begin="-4s" repeatCount="indefinite" />
          <animate attributeName="cy" values="300;280;300" dur="10s" begin="-4s" repeatCount="indefinite" />
        </circle>
      </g>
    </svg>
  );
};

export default FloatingOrbsTopRightSVG; 