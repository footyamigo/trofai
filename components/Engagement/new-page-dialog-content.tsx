import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";
import { Input } from "./input";
import { Label } from "./label";
import { SlideType } from "./validation/slide-schema";
import { Plus, X } from "lucide-react";

export function NewSlideDialogContent({
  handleAddPage,
}: {
  handleAddPage: (pageType: SlideType) => void;
}) {
  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>New Slide</DialogTitle>
        <DialogDescription>
          {"Select the type of slide to add."}
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 items-center gap-4">
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                handleAddPage(SlideType.enum.Content);
              }}
            >
              Content Slide
            </Button>
          </DialogTrigger>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                handleAddPage(SlideType.enum.Intro);
              }}
            >
              Intro Slide
            </Button>
          </DialogTrigger>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                handleAddPage(SlideType.enum.Outro);
              }}
            >
              Outro Slide
            </Button>
          </DialogTrigger>
        </div>
      </div>
    </DialogContent>
  );
}
