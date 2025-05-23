import React from 'react';

const LeftEdgeBloomSVG = ({ fill, style }) => {
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
        <radialGradient id="bloomGradientLE" cx="0%" cy="50%" r="70%" fx="0%" fy="50%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.7 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0.05 }} />
        </radialGradient>
        <filter id="bloomBlurLE" x="-100%" y="-50%" width="300%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="30" />
        </filter>
      </defs>
      <g opacity="0.8" filter="url(#bloomBlurLE)">
        <ellipse cx="-50" cy="500" rx="250" ry="350" fill="url(#bloomGradientLE)">
          <animate attributeName="rx" values="250;300;250" dur="15s" repeatCount="indefinite" />
          <animate attributeName="ry" values="350;320;350" dur="18s" repeatCount="indefinite" />
          <animate attributeName="cx" values="-50;-20;-50" dur="16s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="0" cy="400" rx="200" ry="300" fill="url(#bloomGradientLE)" opacity="0.7">
          <animate attributeName="rx" values="200;240;200" dur="17s" begin="-2s" repeatCount="indefinite" />
          <animate attributeName="ry" values="300;330;300" dur="14s" begin="-2s" repeatCount="indefinite" />
          <animate attributeName="cx" values="0;20;0" dur="19s" begin="-2s" repeatCount="indefinite" />
        </ellipse>
      </g>
    </svg>
  );
};

export default LeftEdgeBloomSVG; 