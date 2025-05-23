import React from 'react';

const WavesSVG = ({ fill = '#62d76b', style = {} }) => (
  <svg viewBox="0 0 450 562" width="100%" height="100%" style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 400 Q 112.5 350 225 400 T 450 400 V 562 H0 Z" fill={fill} opacity="0.18"/>
    <path d="M0 480 Q 112.5 430 225 480 T 450 480 V 562 H0 Z" fill={fill} opacity="0.12"/>
    <path d="M0 520 Q 112.5 500 225 520 T 450 520 V 562 H0 Z" fill={fill} opacity="0.10"/>
  </svg>
);

export default WavesSVG; 