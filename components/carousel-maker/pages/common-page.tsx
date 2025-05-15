import React from "react";
import * as z from "zod";
import { ConfigSchema } from "../../../lib/carousel-maker/validation/document-schema";
import { CommonSlideSchema } from "../../../lib/carousel-maker/validation/slide-schema";
import { SlideFieldPath } from "../../../lib/carousel-maker/document-form-types";

export function CommonPage({
  index,
  config,
  slide,
  size,
  fieldName,
  className,
}: {
  index: number;
  config: z.infer<typeof ConfigSchema>;
  slide: z.infer<typeof CommonSlideSchema>;
  size: { width: number; height: number };
  fieldName: SlideFieldPath;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
    >
      {/* Placeholder for now */}
    </div>
  );
} 