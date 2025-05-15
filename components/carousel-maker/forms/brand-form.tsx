"use client";
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

import { DocumentFormReturn } from "../../../lib/carousel-maker/document-form-types"; // Adjusted path
import ImageFormField from "./fields/image-form-field"; // Adjusted path

export default function BrandForm({}: {}) { // Changed to export default
  const form: DocumentFormReturn = useFormContext(); // retrieve those props

  return (
    <Form {...form}>
      <form className="space-y-6 w-full">
        <FormField
          control={form.control}
          name="config.brand.name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Your name" className="" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="config.brand.handle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Handle</FormLabel>
              <FormControl>
                <Input placeholder="Your handle" className="" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <ImageFormField
          form={form}
          label="Avatar Image"
          fieldName="config.brand.avatar"
        />
      </form>
    </Form>
  );
} 