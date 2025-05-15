import React from "react";

// This component renders the SVG from line.svg, allowing the stroke color to be set via the fill prop.

const LineSVG = ({ fill = "#403f3f", style = {}, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="1080"
    height="1350"
    viewBox="0 0 810 1012.5"
    style={style}
    {...props}
  >
    <path
      strokeLinecap="butt"
      transform="matrix(0.749628, -0.00173525, 0.00173525, 0.749628, 81.156456, 80.960014)"
      fill="none"
      strokeLinejoin="miter"
      d="M 0.00030112 2.002226 L 864.002032 2.001235 "
      stroke={fill}
      strokeWidth="4"
      strokeOpacity="1"
      strokeMiterlimit="4"
    />
    <path
      strokeLinecap="butt"
      transform="matrix(0.749628, -0.00173525, 0.00173525, 0.749628, 81.152987, 928.041642)"
      fill="none"
      strokeLinejoin="miter"
      d="M -0.000271768 1.997552 L 864.001447 2.001772 "
      stroke={fill}
      strokeWidth="4"
      strokeOpacity="1"
      strokeMiterlimit="4"
    />
  </svg>
);

export default LineSVG; 