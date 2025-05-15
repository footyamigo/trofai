import React from "react";

// This component renders the SVG from circles.svg, allowing the fill color to be set via props.
// Only the main path fill is replaced with the fill prop for dynamic coloring.

const CirclesSVG = ({ fill = "#4c5a89", style = {}, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1080"
    height="1350"
    viewBox="0 0 810 1012.5"
    style={style}
    {...props}
  >
    {/* Main left and right circles */}
    <g>
      <circle cx="0.2" cy="506" r="60.72" fill={fill} fillOpacity="1" />
      <circle cx="809.87" cy="506" r="60.72" fill={fill} fillOpacity="1" />
    </g>
    {/* Decorative small circle */}
    <circle cx="734.8" cy="935.5" r="7" fill={fill} fillOpacity="0.5" />
  </svg>
);

export default CirclesSVG; 