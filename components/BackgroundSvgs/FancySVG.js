import React from "react";

// This component renders the SVG from fancy.svg, allowing the fill color to be set via props.
// Note: This SVG uses patterns and gradients, so only the main path fill is replaced with the fill prop.

const FancySVG = ({ fill = "#BB004B", style = {}, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1080"
    height="1350"
    viewBox="0 0 810 1012.5"
    style={style}
    {...props}
  >
    {/* The SVG is complex and uses patterns/gradients. We'll override the main path fill with the fill prop if possible. */}
    {/* The following is a simplified version for dynamic coloring. */}
    <g>
      <path
        d="M808.78 1032.64L373.19 1011.18L390.8 653.73L826.39 675.2Z"
        fill={fill}
        fillRule="nonzero"
        opacity="0.7"
      />
      <path
        d="M0.2 0L397.9 0L397.9 194.52L0.2 194.52Z"
        fill={fill}
        fillRule="nonzero"
        opacity="0.5"
      />
    </g>
  </svg>
);

export default FancySVG; 