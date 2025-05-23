import React from 'react';

const FloatingIslandsBottomRightSVG = ({ fill, style }) => {
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
        <linearGradient id="islandGradientBR" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.7 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0.2 }} />
        </linearGradient>
        <filter id="islandBlurBR" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
        </filter>
      </defs>
      <g opacity="0.75" filter="url(#islandBlurBR)">
        <ellipse cx="700" cy="850" rx="150" ry="80" fill="url(#islandGradientBR)" opacity="0.6">
          <animate attributeName="cx" values="700;680;700" dur="13s" repeatCount="indefinite" />
          <animate attributeName="cy" values="850;870;850" dur="15s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="580" cy="920" rx="120" ry="60" fill="url(#islandGradientBR)" opacity="0.5">
          <animate attributeName="cx" values="580;600;580" dur="14s" begin="-2.5s" repeatCount="indefinite" />
          <animate attributeName="cy" values="920;900;920" dur="12s" begin="-2.5s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="750" cy="750" rx="100" ry="50" fill="url(#islandGradientBR)" opacity="0.4">
          <animate attributeName="cx" values="750;770;750" dur="12s" begin="-1s" repeatCount="indefinite" />
          <animate attributeName="cy" values="750;730;750" dur="16s" begin="-1s" repeatCount="indefinite" />
        </ellipse>
      </g>
    </svg>
  );
};

export default FloatingIslandsBottomRightSVG; 