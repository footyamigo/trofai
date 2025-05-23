import React from 'react';

const MeshSVG = ({ fill = '#62d76b', style = {} }) => (
  <svg viewBox="0 0 450 562" width="100%" height="100%" style={style} fill="none" xmlns="http://www.w3.org/2000/svg">
    <g opacity="0.13">
      <path d="M0 100 Q 112.5 200 225 100 T 450 100" stroke={fill} strokeWidth="2"/>
      <path d="M0 200 Q 112.5 300 225 200 T 450 200" stroke={fill} strokeWidth="2"/>
      <path d="M0 300 Q 112.5 400 225 300 T 450 300" stroke={fill} strokeWidth="2"/>
      <path d="M0 400 Q 112.5 500 225 400 T 450 400" stroke={fill} strokeWidth="2"/>
      <path d="M0 500 Q 112.5 600 225 500 T 450 500" stroke={fill} strokeWidth="2"/>
    </g>
  </svg>
);

export default MeshSVG; 