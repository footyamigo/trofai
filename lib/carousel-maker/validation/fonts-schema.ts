import * as z from "zod";

export const FontsSchema = z.object({
  font1: z.string().default("DM_Sans"),
  font2: z.string().default("DM_Serif_Display"),
}); 