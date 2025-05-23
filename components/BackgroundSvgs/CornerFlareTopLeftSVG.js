import React from 'react';

const CornerFlareTopLeftSVG = ({ fill, style }) => {
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
        <radialGradient id="flareGradientTL" cx="0%" cy="0%" r="70%" fx="0%" fy="0%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.6 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0 }} />
        </radialGradient>
        <filter id="flareBlurTL" x="-50%" y="-50%" width="250%" height="250%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="30" />
        </filter>
      </defs>
      <g opacity="0.85">
        <ellipse cx="50" cy="50" rx="400" ry="300" fill="url(#flareGradientTL)" filter="url(#flareBlurTL)">
          <animate attributeName="rx" values="400;450;400" dur="12s" repeatCount="indefinite" />
          <animate attributeName="ry" values="300;330;300" dur="15s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="100" cy="100" rx="300" ry="200" fill="url(#flareGradientTL)" filter="url(#flareBlurTL)" opacity="0.7">
           <animate attributeName="rx" values="300;270;300" dur="14s" begin="-1s" repeatCount="indefinite" />
           <animate attributeName="ry" values="200;230;200" dur="13s" begin="-1s" repeatCount="indefinite" />
        </ellipse>
      </g>
    </svg>
  );
};

export default CornerFlareTopLeftSVG; 