import { useFormContext } from "react-hook-form";
// import * as z from "zod"; // Unused, commented out

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form"; // Adjusted path

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"; // Adjusted path
import { fontsMap } from "../../../lib/carousel-maker/fonts-map"; // Adjusted path
import { DocumentFormReturn } from "../../../lib/carousel-maker/document-form-types"; // Adjusted path

export default function FontsForm({}: {}) { // Changed to export default
  const form: DocumentFormReturn = useFormContext(); // retrieve those props

  return (
    <Form {...form}>
      <form className="space-y-6 w-full">
        <FormField
          control={form.control}
          name="config.fonts.font1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Font 1</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select primary font" />
                  </SelectTrigger>
                </FormControl>
                <FontSelectContent />
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="config.fonts.font2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Font 2</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a secondary font" />
                  </SelectTrigger>
                </FormControl>
                <FontSelectContent />
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

function FontSelectContent() {
  return (
    <SelectContent>
      {Object.keys(fontsMap).map((fontId) => (
        <SelectItem key={fontId} value={fontId}>
          <p className={fontsMap[fontId].className}>{fontsMap[fontId].name}</p>
        </SelectItem>
      ))}
    </SelectContent>
  );
} 