"use client";

import { SidebarPanel } from "./settings-panel"; // Corrected to named import
import { SlidesEditor } from "./slides-editor"; // Corrected to named import
import React from "react";
import { useComponentPrinter } from "../../lib/carousel-maker/hooks/use-component-printer"; // Adjusted path

import { RefProvider } from "../../lib/carousel-maker/providers/reference-context"; // Adjusted path
import { MainNav } from "./main-nav"; // Corrected to named import

export default function Editor({}: {}) {
  const { componentRef, handlePrint, isPrinting } = useComponentPrinter();

  return (
    <RefProvider myRef={componentRef}>
      <div className="flex-1 flex flex-col">
        <MainNav
          className="h-14 border-b px-6 "
          handlePrint={handlePrint}
          isPrinting={isPrinting}
        />
        <div className="flex-1 flex flex-start  md:grid md:grid-cols-[320px_minmax(0,1fr)] ">
          <SidebarPanel />
          <SlidesEditor />
        </div>
      </div>
    </RefProvider>
  );
} 