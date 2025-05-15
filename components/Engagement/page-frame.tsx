import React from "react";
import { cn } from "./utils";
import { usePagerContext } from "./providers/pager-context";
import { getParent, getSlideNumber } from "./field-path";
import { useSelection } from "./hooks/use-selection";
import { useSelectionContext } from "./providers/selection-context";

export function PageFrame({
  children,
  fieldName,
  className,
}: {
  children: React.ReactNode;
  fieldName: string;
  className?: string;
}) {
  const { setCurrentPage } = usePagerContext();
  const { setCurrentSelection } = useSelectionContext();
  const pageNumber = getSlideNumber(fieldName);

  return (
    <div
      className={cn("flex flex-col h-full w-full", className)}
      onClick={(event) => {
        setCurrentPage(pageNumber);
        setCurrentSelection(fieldName, event);
      }}
    >
      {children}
    </div>
  );
}
