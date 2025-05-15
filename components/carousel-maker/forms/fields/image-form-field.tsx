import {
  DocumentFormReturn,
  ImageFieldPath,
  ImageStyleOpacityFieldPath,
} from "../../../../lib/carousel-maker/document-form-types"; // Adjusted path
import { ImageSourceFormField } from "./image-source-form-field"; // Adjusted path
import { OpacityFormField } from "./opacity-form-field"; // Adjusted path

export default function ImageFormField({ // Changed to export default
  fieldName,
  form,
  label,
}: {
  fieldName: ImageFieldPath;
  form: DocumentFormReturn;
  label: string;
}) {
  return (
    <>
      <h3 className="text-base">{label}</h3>
      <ImageSourceFormField fieldName={`${fieldName}.source`} form={form} />
      <OpacityFormField
        fieldName={`${fieldName}.style.opacity` as ImageStyleOpacityFieldPath}
        form={form}
        label={"Opacity"}
        disabled={form.getValues(`${fieldName}.source.src`) == ""}
      />
    </>
  );
} 