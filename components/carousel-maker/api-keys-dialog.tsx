"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./ui/drawer";
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
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
// import { useKeys } from "@/lib/hooks/use-keys"; // Commented out
import React, { useEffect } from "react";
import { useKeysContext } from "../../lib/carousel-maker/providers/keys-context";
import { useMediaQuery } from "../../lib/carousel-maker/hooks/use-media-query";

const FormSchema = z.object({
  key: z.string().min(2, {
    message: "Key must be at least 2 characters.",
  }),
});

function ApiKeyForm() {
  const { setApiKey } = useKeysContext();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      key: "",
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    setApiKey(data.key);
    toast({
      title: "You've added your API key for this session",
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-2/3 space-y-6 px-4"
      >
        <FormField
          control={form.control}
          name="key"
          render={({ field }) => (
            <FormItem>
              <FormLabel>API KEY</FormLabel>
              <FormControl>
                <Input placeholder="sk-****123" {...field} />
              </FormControl>
              <FormDescription>This is your OpenAI API Key.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex flex-row gap-2">
          <Button type="submit">Save</Button>
          <Button
            type="reset"
            variant={"destructive"}
            onClick={() => {
              setApiKey("");
              form.reset();
            }}
          >
            Clear
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function BringYourKeysDialog({
  triggerButton,
}: {
  triggerButton: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{triggerButton}</DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add your OpenAI key</DialogTitle>
            <DialogDescription>
              {
                "The key is never stored for security reasons. It's cleared after refresh."
              }
            </DialogDescription>
          </DialogHeader>
          <ApiKeyForm />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Add your OpenAI key</DrawerTitle>
          <DrawerDescription>
            {
              "The key is never stored for security reasons. It's cleared after refresh."
            }
          </DrawerDescription>
        </DrawerHeader>
        <ApiKeyForm />
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
} 