import { SlideType } from "../../../lib/carousel-maker/validation/slide-schema";

import { Button } from "../ui/button";
import { Dialog, DialogTrigger } from "../ui/dialog";
import { Plus } from "lucide-react";
import { NewSlideDialogContent } from "../new-page-dialog-content";
import { cn } from "../../../lib/utils";

export function NewPage({
  size,
  className = "",
  handleAddPage,
  isSideButton,
}: {
  size: { width: number; height: number };
  className?: string;
  handleAddPage: (pageType: SlideType) => void;
  isSideButton: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className={cn("border-dashed border-2", className)}
          variant={"outline"}
          style={{
            width: `${isSideButton ? size.width / 4 : size.width}px`,
            height: `${size.height}px`,
            minWidth: `${isSideButton ? size.width / 4 : size.width}px`,
            minHeight: `${size.height}px`,
          }}
        >
          <div className={`flex flex-col justify-center items-center`}>
            <Plus className="w-6 h-6" />
          </div>
        </Button>
      </DialogTrigger>
      <NewSlideDialogContent handleAddPage={handleAddPage} />
    </Dialog>
  );
} 