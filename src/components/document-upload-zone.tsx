"use client";

import { useCallback, useState } from "react";

type ClientOption = { id: string; name: string };

export function DocumentUploadZone({
  action,
  clients,
  fixedClientId,
  fixedClientName,
}: {
  action: (formData: FormData) => void | Promise<void>;
  clients?: ClientOption[];
  fixedClientId?: string;
  fixedClientName?: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [fileCount, setFileCount] = useState(0);

  const onFiles = useCallback((list: FileList | null) => {
    setFileCount(list?.length ?? 0);
  }, []);

  return (
    <form
      action={action}
      className={`space-y-4 rounded-2xl border-2 border-dashed p-5 transition ${
        dragOver
          ? "border-emerald-500 bg-emerald-50/80"
          : "border-slate-300 bg-slate-50/60"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const input = e.currentTarget.querySelector(
          'input[type="file"]',
        ) as HTMLInputElement | null;
        if (input && e.dataTransfer.files.length) {
          input.files = e.dataTransfer.files;
          onFiles(input.files);
        }
      }}
    >
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-900">
          Coffre-fort documentaire
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Glissez-déposez vos fichiers ou sélectionnez-les — PDF, images, Excel,
          CSV (10 Mo max / fichier, jusqu&apos;à 10 fichiers).
        </p>
      </div>

      {!fixedClientId && clients && clients.length > 0 && (
        <div>
          <label
            className="text-sm font-medium text-slate-700"
            htmlFor="upload-client"
          >
            Client dossier *
          </label>
          <select
            id="upload-client"
            name="clientId"
            required
            defaultValue=""
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
          >
            <option value="" disabled>
              Choisir un client…
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {fixedClientId && (
        <>
          <input type="hidden" name="clientId" value={fixedClientId} />
          {fixedClientName && (
            <p className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700">
              Dossier : <span className="font-semibold">{fixedClientName}</span>
            </p>
          )}
        </>
      )}

      <div>
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="upload-files"
        >
          Fichiers *
        </label>
        <input
          id="upload-files"
          name="files"
          type="file"
          required
          multiple
          accept=".pdf,image/jpeg,image/png,image/webp,.xlsx,.xls,.csv"
          onChange={(e) => onFiles(e.target.files)}
          className="mt-2 block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-emerald-700"
        />
        {fileCount > 0 && (
          <p className="mt-1 text-xs text-emerald-800">
            {fileCount} fichier{fileCount > 1 ? "s" : ""} sélectionné
            {fileCount > 1 ? "s" : ""}
            {" "}— classement et OCR automatiques.
          </p>
        )}
      </div>

      <div>
        <label
          className="text-sm font-medium text-slate-700"
          htmlFor="upload-label"
        >
          Libellé commun (optionnel)
        </label>
        <input
          id="upload-label"
          name="label"
          type="text"
          placeholder="ex. Pièces TVA T1 2026"
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-emerald-500/30 focus:ring-2"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
      >
        Déposer dans le coffre-fort
      </button>
    </form>
  );
}
