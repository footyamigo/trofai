import { DocumentFormReturn } from "../../lib/carousel-maker/document-form-types";
import { useEffect, useState } from "react";
import { useFormContext } from "react-hook-form";
import { Input } from "./ui/input";
import { ConfigSchema } from "../../lib/carousel-maker/validation/document-schema";
import { MultiSlideSchema } from "../../lib/carousel-maker/validation/slide-schema";
import FileInputForm from "./forms/file-input-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { useFieldsFileImporter } from "../../lib/carousel-maker/hooks/use-fields-file-importer";

export function JsonImporter({
  fields,
  children,
}: {
  fields: "config" | "slides";
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const { handleFileSubmission } = useFieldsFileImporter(fields);
  // TODO: Make this component more generic by splitting dependencies of config and slides

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger> 
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Load a file with Config/Content</DialogTitle>
        </DialogHeader>

        <FileInputForm
          handleSubmit={handleFileSubmission}
          label={"Input File"}
          description="Select a json file to load"
        />
      </DialogContent>
    </Dialog>
  );
} 