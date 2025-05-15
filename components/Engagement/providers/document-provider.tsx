"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import FormProvider from "./providers/form-provider";
import * as z from "zod";
import {
  useRetrieveFormValues,
  usePersistFormValues,
} from "./hooks/use-persist-form";

import { DocumentSchema } from "./validation/document-schema";
import { PagerProvider } from "./providers/pager-context";
import { usePager } from "./hooks/use-pager";
import { SelectionProvider } from "./providers/selection-context";
import { useSelection } from "./hooks/use-selection";
import { DocumentFormReturn } from "./document-form-types";
import { defaultValues } from "./default-document";
import { KeysProvider } from "./providers/keys-context";
import { useKeys } from "./hooks/use-keys";
import { StatusProvider } from "./providers/editor-status-context";

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
