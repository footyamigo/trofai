// import { Type } from "lucide-react"; // Unused, Type is imported and used in style-menu.tsx
import {
  FormControl,
  FormField,
  FormItem,
  // FormLabel, // Unused, commented out
  FormMessage,
} from "../../ui/form"; // Adjusted path
import {
  DocumentFormReturn,
  ImageStyleObjectFitFieldPath,
  TextStyleAlignFieldPath,
  TextStyleFontSizeFieldPath,
} from "../../../../lib/carousel-maker/document-form-types"; // Adjusted path
import { RadioGroup } from "../../ui/radio-group"; // Adjusted path, was pointing to radix directly
import { CustomIndicatorRadioGroupItem } from "../../ui/custom-indicator-radio-group-item"; // Adjusted path
import { cn } from "../../../../lib/utils"; // Adjusted path
import React from "react";
import { TypographyFieldName } from "../../typography"; // Adjusted path

export function EnumRadioGroupField<T extends string | number | symbol>({
  fieldName,
  form,
  enumValueElements,
  name,
  itemClassName = "",
  groupClassName = "",
}: {
  fieldName:
    | TextStyleFontSizeFieldPath
    | TextStyleAlignFieldPath
    | ImageStyleObjectFitFieldPath;
  form: DocumentFormReturn;
  name: string;
  enumValueElements: Record<T, React.ReactNode>;
  itemClassName?: string;
  groupClassName?: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <TypographyFieldName>{name}</TypographyFieldName>
      <FormField
        control={form.control}
        name={fieldName}
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={form.getValues(fieldName)}
                className={cn("flex flex-row gap-0.5", groupClassName)}
              >
                {Object.entries<React.ReactNode>(
                  enumValueElements
                ).map<React.ReactNode>(([value, icon]) => (
                  <FormItem className="flex items-center" key={value}>
                    <FormControl>
                      <CustomIndicatorRadioGroupItem
                        value={value}
                        className={cn(
                          "h-5 w-5 flex flex-col items-center justify-center data-[state=unchecked]:border-transparent border",
                          itemClassName
                        )}
                      >
                        {icon}
                      </CustomIndicatorRadioGroupItem>
                    </FormControl>
                    {/* <FormLabel className="font-normal">Huemint 1</FormLabel> */}
                  </FormItem>
                ))}
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
} 