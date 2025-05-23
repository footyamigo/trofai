import React from 'react';

const BlobClusterTopLeftSVG = ({ fill, style }) => {
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
        <linearGradient id="blobClusterGradientTL" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.7 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0.3 }} />
        </linearGradient>
        <filter id="blobClusterBlurTL" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="20" />
        </filter>
      </defs>
      <g opacity="0.7" filter="url(#blobClusterBlurTL)">
        {/* Blob 1 */}
        <path 
          d="M100,150 C50,100 50,250 100,300 S180,320 200,250 S150,100 100,150 Z"
          fill="url(#blobClusterGradientTL)"
        />
        {/* Blob 2 - slightly offset and smaller */}
        <path 
          d="M180,120 C140,80 130,220 180,260 S250,270 260,210 S220,80 180,120 Z"
          fill="url(#blobClusterGradientTL)" 
          opacity="0.8"
          transform="translate(30, 50)"
        />
        {/* Blob 3 - different shape, more offset */}
        <path 
          d="M80,250 C40,220 50,350 90,380 S170,390 180,340 S120,220 80,250 Z"
          fill="url(#blobClusterGradientTL)" 
          opacity="0.7"
          transform="translate(-20, 10)"
        />
      </g>
    </svg>
  );
};

export default BlobClusterTopLeftSVG; 