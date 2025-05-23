import React from 'react';

const SubtleGradientLinesSVG = ({ fill, style }) => {
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
        <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.1 }} />
          <stop offset="50%" style={{ stopColor: fill, stopOpacity: 0.5 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0.1 }} />
        </linearGradient>
        <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style={{ stopColor: fill, stopOpacity: 0.05 }} />
          <stop offset="50%" style={{ stopColor: fill, stopOpacity: 0.3 }} />
          <stop offset="100%" style={{ stopColor: fill, stopOpacity: 0.05 }} />
        </linearGradient>
      </defs>
      <g>
        {[...Array(15)].map((_, i) => (
          <line
            key={`hLine-${i}`}
            x1="0"
            y1={(i / 15) * 1000 + (Math.random() - 0.5) * 30}
            x2="800"
            y2={(i / 15) * 1000 + (Math.random() - 0.5) * 30}
            stroke="url(#lineGrad1)"
            strokeWidth={Math.random() * 2 + 0.5} // 0.5 to 2.5
          />
        ))}
        {[...Array(10)].map((_, i) => (
          <line
            key={`vLine-${i}`}
            x1={(i / 10) * 800 + (Math.random() - 0.5) * 40}
            y1="0"
            x2={(i / 10) * 800 + (Math.random() - 0.5) * 40}
            y2="1000"
            stroke="url(#lineGrad2)"
            strokeWidth={Math.random() * 1.5 + 0.3} // 0.3 to 1.8
          />
        ))}
      </g>
    </svg>
  );
};

export default SubtleGradientLinesSVG; 