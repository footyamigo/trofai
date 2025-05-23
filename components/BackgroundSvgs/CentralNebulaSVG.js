import React from 'react';

const CentralNebulaSVG = ({ fill, style }) => {
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
        <radialGradient id="nebulaGradientC" cx="50%" cy="50%" r="60%" fx="50%" fy="50%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.5 }} />
          <stop offset="40%" style={{ stopColor: fill, stopOpacity: 0.2 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0 }} />
        </radialGradient>
        <filter id="nebulaBlurC" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="40" />
        </filter>
      </defs>
      <g opacity="0.9">
        <ellipse cx="400" cy="500" rx="300" ry="200" fill="url(#nebulaGradientC)" filter="url(#nebulaBlurC)">
          <animate attributeName="rx" values="300;350;300" dur="14s" repeatCount="indefinite" />
          <animate attributeName="ry" values="200;250;200" dur="16s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;1;0.8" dur="10s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="400" cy="500" rx="200" ry="150" fill="url(#nebulaGradientC)" filter="url(#nebulaBlurC)" opacity="0.7">
           <animate attributeName="rx" values="200;150;200" dur="15s" begin="-2s" repeatCount="indefinite" />
           <animate attributeName="ry" values="150;200;150" dur="13s" begin="-2s" repeatCount="indefinite" />
        </ellipse>
      </g>
    </svg>
  );
};

export default CentralNebulaSVG; 