import React from 'react';

const CentralBlobArraySVG = ({ fill, style }) => {
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
        <linearGradient id="centralBlobGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.6 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0.2 }} />
        </linearGradient>
        <filter id="centralBlobBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="25" />
        </filter>
      </defs>
      <g opacity="0.75" filter="url(#centralBlobBlur)">
        {/* Blob 1 - Center */}
        <path 
          d="M400,500 C300,450 300,600 400,630 S500,600 500,500 S500,450 400,500 Z"
          fill="url(#centralBlobGradient)"
        />
        {/* Blob 2 - Offset slightly up-left */}
        <path 
          d="M350,420 C280,380 270,500 350,530 S450,540 440,470 S420,380 350,420 Z"
          fill="url(#centralBlobGradient)" 
          opacity="0.85"
          transform="translate(-30, -40)"
        />
        {/* Blob 3 - Offset slightly down-right */}
        <path 
          d="M480,580 C420,550 430,680 490,700 S580,700 590,640 S540,550 480,580 Z"
          fill="url(#centralBlobGradient)" 
          opacity="0.8"
          transform="translate(20, 30)"
        />
      </g>
    </svg>
  );
};

export default CentralBlobArraySVG; 