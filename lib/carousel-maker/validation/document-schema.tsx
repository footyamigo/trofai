import * as z from "zod";
import { MultiSlideSchema, UnstyledMultiSlideSchema } from "./slide-schema"; // Adjusted path
import { ThemeSchema } from "./theme-schema"; // Adjusted path
import { BrandSchema } from "./brand-schema"; // Adjusted path
import { FontsSchema } from "./fonts-schema"; // Adjusted path
import { PageNumberSchema } from "./page-number-schema"; // Adjusted path

export const ConfigSchema = z.object({
  brand: BrandSchema,
  theme: ThemeSchema,
  fonts: FontsSchema,
  pageNumber: PageNumberSchema,
});

export const DocumentSchema = z.object({
  slides: MultiSlideSchema,
  config: ConfigSchema,
  filename: z.string(),
});

export const UnstyledDocumentSchema = z.object({
  slides: UnstyledMultiSlideSchema,
}); 