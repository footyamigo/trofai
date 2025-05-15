import { useFormContext } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form"; // Adjusted path
import { Input } from "../ui/input"; // Adjusted path
import { cn } from "../../../lib/utils"; // Adjusted path
import { Textarea } from "../ui/textarea"; // Adjusted path
import { DocumentFormReturn } from "../../../lib/carousel-maker/document-form-types"; // Adjusted path

export function FilenameForm({ className = "" }: { className?: string }) {
  const form: DocumentFormReturn = useFormContext(); // retrieve those props

  return (
    <Form {...form}>
      <form className="">
        <FormField
          control={form.control}
          name="filename"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  placeholder="Untitled Carousel"
                  className={cn(
                    "py-0 h-8 border-none text-right text-base font-semibold",
                    className
                  )}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
} 