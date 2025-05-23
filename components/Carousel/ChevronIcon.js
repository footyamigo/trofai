import React from 'react';

const ChevronIcon = ({ rotated = false, size = 18, color = "#222" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 20 20"
    style={{
      display: 'inline-block',
      transition: 'transform 0.2s',
      transform: rotated ? 'rotate(90deg)' : 'rotate(0deg)',
      verticalAlign: 'middle'
    }}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <polyline
      points="6 8 10 12 14 8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default ChevronIcon; 