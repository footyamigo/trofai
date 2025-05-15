import * as z from "zod";
import { MultiSlideSchema } from "./validation/slide-schema";
import { SlideType } from "./validation/slide-schema";

import { getDefaultSlideOfType } from "./default-slides";
import { DEFAULT_IMAGE_INPUT } from "./validation/image-schema";

const defaultSlideValues: z.infer<typeof MultiSlideSchema> = [
  getDefaultSlideOfType(SlideType.enum.Intro),
  getDefaultSlideOfType(SlideType.enum.Common),
  getDefaultSlideOfType(SlideType.enum.Content),
  getDefaultSlideOfType(SlideType.enum.Content),
  getDefaultSlideOfType(SlideType.enum.Outro),
];

export const defaultValues = {
  slides: defaultSlideValues,
  config: {
    brand: {
      avatar: DEFAULT_IMAGE_INPUT,

      name: "My name",
      handle: "@name",
    },
    theme: {
      // isCustom: false, // TODO: Re-enable when custom themes are supported
      // pallette: "black", // TODO: Re-enable when pallette selection is supported
      colorScheme: "black", // Temp, replace with pallette
      primary: "#0d0d0d",
      secondary: "#161616",
      background: "#ffffff",
    },
    fonts: {
      font1: "DM_Serif_Display",
      font2: "DM_Sans",
    },
    pageNumber: {
      showNumbers: true,
    },
  },
  filename: "My Carousel File",
}; 