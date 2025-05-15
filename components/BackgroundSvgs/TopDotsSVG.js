import React from "react";

// This component renders the SVG from top dots.svg, allowing the fill color to be set via props.

const TopDotsSVG = ({ fill = "#00ff9d", style = {}, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1200"
    height="1500"
    viewBox="0 0 900 1125"
    style={style}
    {...props}
  >
    {/* Dots columns, simplified for dynamic coloring */}
    {[795.71, 754.88, 714.05].map((x, i) => (
      Array.from({ length: 7 }).map((_, j) => (
        <rect
          key={`dot-${i}-${j}`}
          x={x}
          y={14.83 + 43.04 * j}
          width={14.29}
          height={14.29}
          fill={fill}
          fillOpacity="1"
        />
      ))
    ))}
  </svg>
);

export default TopDotsSVG; 