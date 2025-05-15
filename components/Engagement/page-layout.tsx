import React from "react";
import { cn } from "./utils";
import { usePagerContext } from "./providers/pager-context";
import { getSlideNumber } from "./field-path";
import { useSelection } from "./hooks/use-selection";
import { useSelectionContext } from "./providers/selection-context";

export function PageLayout({
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
      className={cn(
        "flex flex-col justify-center grow items-stretch",
        className
      )}
      onClick={(event) => {
        setCurrentPage(pageNumber);
        setCurrentSelection(fieldName, event);
      }}
    >
      {children}
    </div>
  );
}
