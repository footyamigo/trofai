"use client";

import Link from "next/link";
// import { SidebarNavItem } from "types/nav"; // This type is not in carousel-generator, can be removed or defined later if needed

import { cn } from "../../lib/utils"; // Adjusted path, assuming utils.ts will be in trofai/lib
import BrandForm from "./forms/brand-form"; // Adjusted path
import ThemeForm from "./forms/theme-form"; // Adjusted path
import {
  VerticalTabs,
  VerticalTabsContent,
  VerticalTabsList,
  VerticalTabsTrigger,
} from "./ui/vertical-tabs"; // Adjusted path
import { usePagerContext } from "../../lib/carousel-maker/providers/pager-context"; // Adjusted path
import { Separator } from "./ui/separator"; // Adjusted path
import FontsForm from "./forms/fonts-form"; // Adjusted path
import PageNumberForm from "./forms/page-number-form"; // Adjusted path
// import { ScrollArea } from "@radix-ui/react-scroll-area"; // Using our own ScrollArea from ./ui/scroll-area
import { ScrollArea, ScrollBar } from "./ui/scroll-area"; // Adjusted path
import {
  Briefcase,
  Brush,
  FileDigit,
  LucideIcon,
  Palette,
  Plus,
  Type,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"; // Adjusted path
import { Drawer } from "vaul"; // This is an external dependency, should be fine if installed
import { DrawerContent, DrawerTrigger } from "./drawer"; // Adjusted path, assuming drawer.tsx is a local wrapper
import { ReactNode, useEffect, useState } from "react";
import { buttonVariants } from "./ui/button"; // Adjusted path
import { useSelectionContext } from "../../lib/carousel-maker/providers/selection-context"; // Adjusted path
// import { useFieldsFileImporter } from "@/lib/hooks/use-fields-file-importer"; // This hook seems unused, comment out for now
// import { set } from "zod"; // This import seems unused, comment out for now
import StyleMenu from "./style-menu"; // Adjusted path
import { useFormContext } from "react-hook-form";
import { DocumentFormReturn } from "../../lib/carousel-maker/document-form-types"; // Adjusted path

type TabInfo = {
  name: string;
  value: string;
  icon: LucideIcon;
};

const ALL_FORMS: Record<string, TabInfo> = {
  brand: {
    name: "Brand",
    value: "brand",
    icon: Briefcase,
  },
  theme: {
    name: "Theme",
    value: "theme",
    icon: Palette,
  },
  fonts: {
    name: "Fonts",
    value: "fonts",
    icon: Type,
  },
  pageNumber: {
    name: "Numbers",
    value: "number",
    icon: FileDigit,
  },
};

export function SidebarPanel({ className }: { className?: string }) {
  const form: DocumentFormReturn = useFormContext();
  const { currentSelection } = useSelectionContext();

  return (
    <div className={cn("h-full flex flex-1", className)}>
      <aside className="top-14 z-30 hidden h-full w-full shrink-0 md:sticky md:block border-r">
        <SidebarTabsPanel />
      </aside>
      <div className="block md:hidden h-0">
        <Drawer.Root modal={true}>
          <DrawerTrigger>
            <CircularFloatingButton className="bottom-28 left-4">
              <Plus className="w-4 h-4" />
            </CircularFloatingButton>
          </DrawerTrigger>
          <DrawerContent className="h-[60%] ">
            <DrawerFormsPanel className="mt-8" />
          </DrawerContent>
        </Drawer.Root>
      </div>
      <div className="block md:hidden h-0">
        <Drawer.Root modal={true}>
          <DrawerTrigger>
            {currentSelection ? (
              <CircularFloatingButton className="bottom-28 right-4">
                <Brush className="w-4 h-4" />
              </CircularFloatingButton>
            ) : null}
          </DrawerTrigger>
          <DrawerContent className="h-[40%] ">
            <StyleMenu form={form} className={"m-4"} />
          </DrawerContent>
        </Drawer.Root>
      </div>
    </div>
  );
}

function VerticalTabTriggerButton({ tabInfo }: { tabInfo: TabInfo }) {
  const { setCurrentSelection } = useSelectionContext();
  //  TODO Convert this comp into a forwardref like its child
  return (
    <VerticalTabsTrigger
      value={tabInfo.value}
      className="h-16 flex flex-col gap-2 items-center py-2 justify-center"
      onFocus={() => setCurrentSelection("", null)}
    >
      <tabInfo.icon className="h-4 w-4" />
      <span className="sr-only ">{tabInfo.name}</span>
      <p className="text-xs">{tabInfo.name}</p>
    </VerticalTabsTrigger>
  );
}

function HorizontalTabTriggerButton({ tabInfo }: { tabInfo: TabInfo }) {
  const { setCurrentSelection } = useSelectionContext();
  //  TODO Convert this comp into a forwardref like its child
  return (
    <TabsTrigger
      value={tabInfo.value}
      className="h-16 flex flex-col gap-2 items-center py-2 justify-center"
      onFocus={() => setCurrentSelection("", null)}
    >
      <tabInfo.icon className="h-4 w-4" />
      <span className="sr-only ">{tabInfo.name}</span>
      <p className="text-xs">{tabInfo.name}</p>
    </TabsTrigger>
  );
}

export function SidebarTabsPanel() {
  const { currentSelection } = useSelectionContext();
  const [tab, setTab] = useState(ALL_FORMS.brand.value);
  const form: DocumentFormReturn = useFormContext();

  return (
    <VerticalTabs
      value={currentSelection ? "" : tab}
      onValueChange={(val) => {
        if (val) {
          // Don't lost previous state when showing current selection
          setTab(val);
        }
      }}
      className="flex-1 h-full p-0"
    >
      <div className="flex flex-row h-full w-full">
        <ScrollArea className="border-r h-full bg-muted">
          <VerticalTabsList className="grid grid-cols-1 gap-2 w-20 rounded-none">
            <VerticalTabTriggerButton tabInfo={ALL_FORMS.brand} />
            <VerticalTabTriggerButton tabInfo={ALL_FORMS.theme} />
            <VerticalTabTriggerButton tabInfo={ALL_FORMS.fonts} />
            <VerticalTabTriggerButton tabInfo={ALL_FORMS.pageNumber} />
          </VerticalTabsList>
        </ScrollArea>
        <div className="p-2 flex flex-col items-stretch w-full ">
          {/* //TODO: Share this area with stylemenu */}
          {currentSelection ? (
            <StyleMenu form={form} className={"m-4"} />
          ) : // TODO: Create consistent styles between tabs and StyleMenu
          null}
          <VerticalTabsContent
            value={ALL_FORMS.brand.value}
            className="mt-0 border-0 p-0 m-4"
          >
            <h4 className="text-xl font-semibold">{ALL_FORMS.brand.name}</h4>
            <Separator className="mt-2 mb-4"></Separator>
            <BrandForm />
          </VerticalTabsContent>
          <VerticalTabsContent
            value={ALL_FORMS.theme.value}
            className="mt-0 border-0 p-0 m-4"
          >
            <h4 className="text-xl font-semibold">{ALL_FORMS.theme.name}</h4>
            <Separator className="mt-2 mb-4"></Separator>
            <ThemeForm />
          </VerticalTabsContent>
          <VerticalTabsContent
            value={ALL_FORMS.fonts.value}
            className="mt-0 border-0 p-0 m-4"
          >
            <h4 className="text-xl font-semibold">{ALL_FORMS.fonts.name}</h4>
            <Separator className="mt-2 mb-4"></Separator>
            <FontsForm />
          </VerticalTabsContent>
          <VerticalTabsContent
            value={ALL_FORMS.pageNumber.value}
            className="mt-0 border-0 p-0 m-4"
          >
            <h4 className="text-xl font-semibold">
              {ALL_FORMS.pageNumber.name}
            </h4>
            <Separator className="mt-2 mb-4"></Separator>
            <PageNumberForm />
          </VerticalTabsContent>
        </div>
      </div>
    </VerticalTabs>
  );
}

export function DrawerFormsPanel({ className }: { className: string }) {
  const { currentSelection } = useSelectionContext();
  const [tab, setTab] = useState(ALL_FORMS.brand.value);
  // TODO: Lift state to not loose it when drawer gets closed ?

  return (
    <Tabs
      value={currentSelection ? "" : tab}
      onValueChange={(val) => {
        if (val) {
          // Don't lost previous state when showing current selection
          setTab(val);
        }
      }}
      className={cn("flex-1 w-full", className)}
    >
      <div className="flex flex-col h-full ">
        <ScrollArea className=" border-b h-full bg-muted">
          <TabsList className="grid grid-cols-4 gap-2 h-20 rounded-none">
            <HorizontalTabTriggerButton tabInfo={ALL_FORMS.brand} />
            <HorizontalTabTriggerButton tabInfo={ALL_FORMS.theme} />
            <HorizontalTabTriggerButton tabInfo={ALL_FORMS.fonts} />
            <HorizontalTabTriggerButton tabInfo={ALL_FORMS.pageNumber} />
          </TabsList>
        </ScrollArea>
        <div className="p-2 w-[320px] m-auto">
          {/* // TODO Should be in a ScrollArea but it does not scroll */}
          <TabsContent
            value={ALL_FORMS.brand.value}
            className="mt-0 border-0 p-0 m-4 "
          >
            <h4 className="text-xl font-semibold">{ALL_FORMS.brand.name}</h4>
            <Separator className="mt-2 mb-4"></Separator>
            <BrandForm />
          </TabsContent>
          <TabsContent
            value={ALL_FORMS.theme.value}
            className="mt-0 border-0 p-0 m-4 "
          >
            <h4 className="text-xl font-semibold">{ALL_FORMS.theme.name}</h4>
            <Separator className="mt-2 mb-4"></Separator>
            <ThemeForm />
          </TabsContent>
          <TabsContent
            value={ALL_FORMS.fonts.value}
            className="mt-0 border-0 p-0 m-4 "
          >
            <h4 className="text-xl font-semibold">{ALL_FORMS.fonts.name}</h4>
            <Separator className="mt-2 mb-4"></Separator>
            <FontsForm />
          </TabsContent>
          <TabsContent
            value={ALL_FORMS.pageNumber.value}
            className="mt-0 border-0 p-0 m-4 "
          >
            <h4 className="text-xl font-semibold">
              {ALL_FORMS.pageNumber.name}
            </h4>
            <Separator className="mt-2 mb-4"></Separator>
            <PageNumberForm />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}

const CircularFloatingButton = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => {
  return (
    <button
      className={cn(
        buttonVariants({
          variant: "default",
          size: "icon",
        }),
        "rounded-full w-12 h-12 fixed z-50 shadow-xl",
        className
      )}
    >
      {children}
    </button>
  );
}; 