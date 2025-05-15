"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFormContext } from "react-hook-form";
import * as z from "zod";

import { Button } from "./ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import { toast } from "./ui/use-toast";
import { Sparkles } from "lucide-react";
// import { generateCarouselSlides } from "@/lib/langchain"; // Commented out
import { DocumentFormReturn } from "../../lib/carousel-maker/document-form-types";
import { useState } from "react";
import { LoadingSpinner } from "./loading-spinner";
import { Textarea } from "./ui/textarea";
import { useKeysContext } from "../../lib/carousel-maker/providers/keys-context";
// import { generateCarouselSlidesAction } from "@/app/actions"; // Commented out

const FormSchema = z.object({
  prompt: z.string().min(2, {
    message: "Prompt must be at least 2 characters.",
  }),
});

export function AITextAreaForm() {
  const { apiKey } = useKeysContext();
  const { setValue }: DocumentFormReturn = useFormContext(); // retrieve those props
  const [isLoading, setIsLoading] = useState(false);
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prompt: "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);

    // Use server action here instead of the local function
    // const generatedSlides = await generateCarouselSlidesAction( // Commented out
    //   `Generate a carousel from this article: "${data.prompt}"`
    // );

    // TODO: Restore local function for going over limit
    // const generatedSlides = await generateCarouselSlides( // Commented out
    //   `Generate a carousel from this article: "${data.prompt}"`,
    //   apiKey
    // );

    // if (generatedSlides) { // Commented out
    //   setValue("slides", generatedSlides);
    //   // TODO Fix toast not working
    //   toast({
    //     title: "New carousel generated",
    //   });
    // } else {
    //   toast({
    //     title: "Failed to generate carousel",
    //   });
    // }
    console.log("TODO: Implement generateCarouselSlidesAction or generateCarouselSlides");
    toast({title: "TODO: Implement generateCarouselSlidesAction or generateCarouselSlides"});
    setIsLoading(false);
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="max-w-lg w-full m-auto"
      >
        <FormField
          control={form.control}
          name="prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel></FormLabel>
              <FormControl>
                <div className="flex flex-row gap-2 items-center w-full">
                  <Textarea
                    placeholder="An article with content for your carousel"
                    className="flex-1"
                    {...field}
                  />
                  <Button type="submit" className="flex-0">
                    {isLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <span className="flex flex-row gap-1.5">
                        {" "}
                        <Sparkles className="w-4 h-4" /> Generate{" "}
                      </span>
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
} 