import * as z from "zod";
import { DEFAULT_BACKGROUND_IMAGE_INPUT, ImageSchema } from "./image-schema";

export const ThemeSchema = z.object({
  colorScheme: z.string(),
  background: z.string().default("#000000"),
  backgroundSecondary: z.string().default("#121212"),
}); 