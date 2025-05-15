import { Button } from "./button";
import { Dialog, DialogTrigger } from "./dialog";
import { Plus } from "lucide-react";
import { getSlideNumber } from "./field-path";
import { useFormContext } from "react-hook-form";
import { NewElementDialogContent } from "./new-element-dialog-content";
import {
  DocumentFormReturn,
  ElementArrayFieldPath,
} from "./document-form-types";

export function AddElement({
  className,
  fieldName,
}: {
  className?: string;
  fieldName: ElementArrayFieldPath;
}) {
  const pageNumber = getSlideNumber(fieldName);
  const form: DocumentFormReturn = useFormContext();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          id={"add-element-" + pageNumber}
          className="border-dashed border-2 w-full bg-transparent h-10"
          variant={"outline"}
        >
          <div className={`flex flex-col justify-center items-center`}>
            <Plus className="w-6 h-6" />
          </div>
        </Button>
      </DialogTrigger>
      <NewElementDialogContent form={form} fieldName={fieldName} />
    </Dialog>
  );
}
