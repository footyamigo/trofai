import {
  interpolate,
  wcagContrast,
  Oklch,
  Color,
  rgb,
  formatHex,
} from "culori";

// const cutNumber = (number: number) => { // Unused, commented out
//   try {
//     if (number) {
//       return +number.toFixed(6);
//     } else {
//       return 0;
//     }
//   } catch (e) {
//     // colorIsInvalid(number)
//     return false;
//   }
// };

const isDark = (color: Color | string) => {
  try {
    if (wcagContrast(color, "black") < wcagContrast(color, "white")) {
      return true;
    }
    return false;
  } catch (e) {
    // colorIsInvalid(color)
    return false;
  }
};

export const generateForegroundColorFrom = function (
  input: Color | string,
  percentage = 0.8
) {
  const result = interpolate(
    [input, isDark(input) ? "white" : "black"],
    "oklch"
  )(percentage);
  return colorObjToString(result as Oklch); // Added type assertion
};

// const generateDarkenColorFrom = function (input: any, percentage = 0.07) { // Unused, commented out
//   try {
//     const result = interpolate([input, "black"], "oklch")(percentage);
//     return colorObjToString(result as Oklch); // Added type assertion
//   } catch (e) {
//     // colorIsInvalid(input)
//     return false;
//   }
// };

export const colorObjToString = function (input: Oklch) {
  const rbgColor = rgb(input);

  return `${formatHex(rbgColor)}`;
}; 