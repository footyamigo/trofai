import React from 'react';

const FluidShapesSVG = ({ fill, style }) => {
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
        <filter id="fluidBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="30" />
        </filter>
        <linearGradient id="fluidGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.7 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0.3 }} />
        </linearGradient>
      </defs>
      <g filter="url(#fluidBlur)">
        <ellipse cx="150" cy="200" rx="180" ry="120" fill="url(#fluidGradient)" opacity="0.6">
          <animate attributeName="cx" values="150;250;150" dur="15s" repeatCount="indefinite" />
          <animate attributeName="cy" values="200;300;200" dur="18s" repeatCount="indefinite" />
          <animate attributeName="rx" values="180;220;180" dur="16s" repeatCount="indefinite" />
          <animate attributeName="ry" values="120;150;120" dur="17s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="600" cy="700" rx="200" ry="140" fill="url(#fluidGradient)" opacity="0.5">
          <animate attributeName="cx" values="600;500;600" dur="16s" repeatCount="indefinite" />
          <animate attributeName="cy" values="700;600;700" dur="14s" repeatCount="indefinite" />
          <animate attributeName="rx" values="200;160;200" dur="18s" repeatCount="indefinite" />
          <animate attributeName="ry" values="140;170;140" dur="15s" repeatCount="indefinite" />
        </ellipse>
        <circle cx="300" cy="500" r="100" fill="url(#fluidGradient)" opacity="0.4">
            <animate attributeName="cx" values="300;400;300" dur="20s" repeatCount="indefinite" />
            <animate attributeName="cy" values="500;450;500" dur="17s" repeatCount="indefinite" />
            <animate attributeName="r" values="100;130;100" dur="19s" repeatCount="indefinite" />
        </circle>
         <ellipse cx="700" cy="150" rx="150" ry="90" fill="url(#fluidGradient)" opacity="0.55">
          <animate attributeName="cx" values="700;650;700" dur="17s" repeatCount="indefinite" />
          <animate attributeName="cy" values="150;250;150" dur="19s" repeatCount="indefinite" />
          <animate attributeName="rx" values="150;120;150" dur="15s" repeatCount="indefinite" />
          <animate attributeName="ry" values="90;110;90" dur="18s" repeatCount="indefinite" />
        </ellipse>
      </g>
    </svg>
  );
};

export default FluidShapesSVG; 