"use client";

import { useMemo, useState } from "react";
import type { ContractFieldDef } from "@/lib/contract-templates";
import { renderContractBody } from "@/lib/contract-templates";

type Props = {
  fields: ContractFieldDef[];
  initialValues: Record<string, string>;
  bodyTemplate: string;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  disabled?: boolean;
};

export function ContractFieldsForm({
  fields,
  initialValues,
  bodyTemplate,
  action,
  submitLabel,
  disabled = false,
}: Props) {
  const [values, setValues] = useState(initialValues);

  const preview = useMemo(
    () => renderContractBody(bodyTemplate, values),
    [bodyTemplate, values],
  );

  const fieldsJson = JSON.stringify(values);

  return (
    <form action={action} className="grid gap-8 lg:grid-cols-2">
      <input type="hidden" name="fieldsJson" value={fieldsJson} readOnly />
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Remplissage du contrat</h2>
        <p className="text-sm text-slate-600">
          Complétez les champs ci-dessous. L&apos;aperçu se met à jour en direct.
        </p>
        {fields.map((f) => (
          <div key={f.key}>
            <label
              htmlFor={`field-${f.key}`}
              className="text-sm font-medium text-slate-700"
            >
              {f.label}
              {f.required && " *"}
            </label>
            {f.type === "textarea" ? (
              <textarea
                id={`field-${f.key}`}
                rows={3}
                required={f.required}
                disabled={disabled}
                placeholder={f.placeholder}
                value={values[f.key] ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
                className="ui-input mt-1"
              />
            ) : (
              <input
                id={`field-${f.key}`}
                type={f.type === "number" ? "text" : f.type}
                inputMode={f.type === "number" ? "decimal" : undefined}
                required={f.required}
                disabled={disabled}
                placeholder={f.placeholder}
                value={values[f.key] ?? ""}
                onChange={(e) =>
                  setValues((v) => ({ ...v, [f.key]: e.target.value }))
                }
                className="ui-input mt-1"
              />
            )}
          </div>
        ))}
        {!disabled && (
          <button type="submit" className="ui-btn ui-btn-primary">
            {submitLabel}
          </button>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-slate-900">Aperçu</h2>
        <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap rounded-2xl border border-slate-200 bg-slate-50 p-5 font-sans text-sm leading-relaxed text-slate-800 shadow-inner">
          {preview}
        </pre>
      </div>
    </form>
  );
}
