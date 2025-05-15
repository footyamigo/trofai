import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/form"; // Adjusted path
import { Slider } from "../../ui/slider"; // Adjusted path
import {
  DocumentFormReturn,
  ImageStyleOpacityFieldPath,
} from "../../../../lib/carousel-maker/document-form-types"; // Adjusted path
import { useEffect, useState } from "react";

export function OpacityFormField({
  fieldName,
  form,
  label,
  disabled = false,
  className = "",
}: {
  fieldName: ImageStyleOpacityFieldPath;
  form: DocumentFormReturn;
  label: string;
  disabled?: boolean;
  className?: string;
}) {
  const [opacity, setOpacity] = useState(-1);

  const opacityValue = form.getValues(fieldName);
  useEffect(() => {
    setOpacity(opacityValue);
  }, [opacityValue]);

  return (
    <FormField
      control={form.control}
      name={fieldName}
      render={({ field: { onChange } }) => {
        return (
          <FormItem className={className}>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Slider
                disabled={opacity == -1 || disabled}
                min={0}
                max={100}
                step={1}
                defaultValue={[opacity]}
                onValueChange={(vals) => {
                  onChange(vals[0]);
                  setOpacity(vals[0]);
                }}
                value={[opacity]}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
} 