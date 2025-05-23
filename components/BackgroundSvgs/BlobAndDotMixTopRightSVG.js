import React from 'react';

const BlobAndDotMixTopRightSVG = ({ fill, style }) => {
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
        <linearGradient id="blobDotMixGradientTR" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.7 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0.3 }} />
        </linearGradient>
        <radialGradient id="dotMixGradientTR" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.8 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0.4 }} />
        </radialGradient>
        <filter id="blobDotMixBlurTR" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="15" />
        </filter>
      </defs>
      <g opacity="0.75" >
        {/* Main Blob */}
        <path 
          d="M650,150 C600,100 600,250 650,300 S730,320 750,250 S700,100 650,150 Z"
          fill="url(#blobDotMixGradientTR)"
          filter="url(#blobDotMixBlurTR)"
        />
        {/* Accompanying Dots */}
        <circle cx="720" cy="120" r="20" fill="url(#dotMixGradientTR)" opacity="0.9" />
        <circle cx="760" cy="200" r="15" fill="url(#dotMixGradientTR)" opacity="0.8" />
        <circle cx="600" cy="280" r="18" fill="url(#dotMixGradientTR)" opacity="0.7" />
         <circle cx="700" cy="320" r="12" fill="url(#dotMixGradientTR)" opacity="0.85" />
      </g>
    </svg>
  );
};

export default BlobAndDotMixTopRightSVG; 