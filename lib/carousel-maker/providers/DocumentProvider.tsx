"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import FormProvider from "./form-provider"; // Adjusted path
import * as z from "zod";
import {
  useRetrieveFormValues,
  usePersistFormValues,
} from "../hooks/use-persist-form"; // Adjusted path

import { DocumentSchema } from "../validation/document-schema"; // Adjusted path
import { PagerProvider } from "./pager-context"; // Adjusted path
import { usePager } from "../hooks/use-pager"; // Adjusted path
import { SelectionProvider } from "./selection-context"; // Adjusted path
import { useSelection } from "../hooks/use-selection"; // Adjusted path
import { DocumentFormReturn } from "../document-form-types"; // Adjusted path
import { defaultValues } from "../default-document"; // Adjusted path
import { KeysProvider } from "./keys-context"; // Adjusted path
import { useKeys } from "../hooks/use-keys"; // Adjusted path
import { StatusProvider } from "./editor-status-context"; // Adjusted path

const FORM_DATA_KEY = "documentFormKey";

export function DocumentProvider({ children }: { children: React.ReactNode }) {
  const { getSavedData } = useRetrieveFormValues(
    FORM_DATA_KEY,
    defaultValues,
    DocumentSchema
  );
  const documentForm: DocumentFormReturn = useForm<
    z.infer<typeof DocumentSchema>
  >({
    resolver: zodResolver(DocumentSchema),
    defaultValues: getSavedData(),
  });
  usePersistFormValues({
    localStorageKey: FORM_DATA_KEY,
    values: documentForm.getValues(),
  });
  const keys = useKeys();

  const selection = useSelection();
  const pager = usePager(0);
  return (
    <KeysProvider value={keys}>
      <FormProvider {...documentForm}>
        <StatusProvider>
          <SelectionProvider value={selection}>
            <PagerProvider value={pager}>
              <div className="flex-1 flex flex-col">{children}</div>
            </PagerProvider>
          </SelectionProvider>
        </StatusProvider>
      </FormProvider>
    </KeysProvider>
  );
} 