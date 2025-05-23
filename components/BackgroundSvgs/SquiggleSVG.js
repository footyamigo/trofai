import React from 'react';

const SquiggleSVG = ({ fill = '#62d76b', style = {} }) => (
  <svg viewBox="0 0 450 562" width="100%" height="100%" style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
    <g opacity="0.15">
      <path d="M20 100 Q 70 150 120 100 T 220 100 T 320 100 T 420 100" stroke={fill} strokeWidth="6" fill="none"/>
      <path d="M30 200 Q 80 250 130 200 T 230 200 T 330 200 T 430 200" stroke={fill} strokeWidth="4" fill="none"/>
      <path d="M10 300 Q 60 350 110 300 T 210 300 T 310 300 T 410 300" stroke={fill} strokeWidth="5" fill="none"/>
    </g>
  </svg>
);

export default SquiggleSVG; 