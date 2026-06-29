"use client";

import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from "lucide-react";
import { useActionState } from "react";
import { residentImportFields, type ResidentImportColumnMapping } from "@/lib/residents/import-shared";
import {
  analyzeResidentImportAction,
  importResidentRowsAction,
  previewResidentImportAction,
  type ResidentImportState,
} from "./actions";

const initialState: ResidentImportState = {};

const statusLabels = {
  auto: "Auto-mapped",
  saved: "Auto-mapped",
  manual: "Manually mapped",
  unmapped: "Unmapped",
};

export function ResidentImportWizard() {
  const [analysisState, analyzeAction, analyzePending] = useActionState(analyzeResidentImportAction, initialState);
  const [previewState, previewAction, previewPending] = useActionState(previewResidentImportAction, initialState);
  const [importState, importAction, importPending] = useActionState(importResidentRowsAction, initialState);
  const mappingSession = analysisState.mappingSession;
  const preview = previewState.preview;
  const result = importState.result;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
            <FileSpreadsheet className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Upload Resident File</h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              Upload Excel or CSV files with real-world barangay headers such as Surname, Given Name, DOB, Sitio, or Mobile.
            </p>
          </div>
        </div>

        <form action={analyzeAction} className="mt-5 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Excel or CSV file</span>
            <input
              type="file"
              name="file"
              accept=".xlsx,.xls,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              required
              className="mt-2 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700"
            />
          </label>
          <button
            type="submit"
            disabled={analyzePending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {analyzePending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="h-4 w-4" aria-hidden="true" />}
            Analyze Headers
          </button>
        </form>

        {analysisState.error ? <Notice tone="danger" message={analysisState.error} /> : null}
      </section>

      {mappingSession ? (
        <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-950">Confirm Column Mapping</h2>
            <p className="mt-1 text-sm text-slate-500">
              Review detected fields before previewing records. Extra columns can stay unmapped and will be ignored.
            </p>
            {mappingSession.missingRequiredFields.length > 0 ? (
              <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <p className="font-semibold">Missing Required Columns</p>
                <p className="mt-1">
                  Map these before previewing: {mappingSession.missingRequiredFields.map((field) => fieldLabel(field)).join(", ")}.
                </p>
              </div>
            ) : null}
          </div>
          <form action={previewAction}>
            <input type="hidden" name="sessionId" value={mappingSession.sessionId} />
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr>
                    <th>Excel Column</th>
                    <th>Mapped System Field</th>
                    <th>Sample Value</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mappingSession.mappings.map((mapping) => (
                    <MappingRow key={`${mapping.columnIndex}-${mapping.originalHeader}`} mapping={mapping} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end border-t border-slate-200 px-5 py-4">
              <button
                type="submit"
                disabled={previewPending}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {previewPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                Preview Records
              </button>
            </div>
          </form>
          {previewState.error ? <Notice tone="danger" message={previewState.error} /> : null}
        </section>
      ) : null}

      {preview ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Metric label="Rows read" value={preview.totalRows} />
            <Metric label="Valid rows" value={preview.validRows} tone="success" />
            <Metric label="Duplicates" value={preview.duplicateRows} tone="warning" />
            <Metric label="Invalid rows" value={preview.invalidRows} tone="danger" />
            <Metric label="Ignored columns" value={preview.ignoredColumns} />
          </section>

          <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Preview Results</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Mapping mode: {preview.mappingMode === "manual" ? "manual adjustments used" : "automatic mapping used"}. Only valid non-duplicate rows will be imported.
                </p>
              </div>
              <form action={importAction}>
                <input type="hidden" name="payload" value={JSON.stringify(preview)} />
                <button
                  type="submit"
                  disabled={importPending || preview.validRows === 0}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {importPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                  Import Valid Rows
                </button>
              </form>
            </div>
            <div className="max-h-[560px] overflow-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Name</th>
                    <th>Birth date</th>
                    <th>Address</th>
                    <th>Purok</th>
                    <th>Status</th>
                    <th>Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 200).map((row) => (
                    <tr key={`${row.rowNumber}-${row.firstName}-${row.lastName}`}>
                      <td className="text-slate-600">{row.rowNumber}</td>
                      <td className="font-medium text-slate-950">
                        {[row.firstName, row.middleName, row.lastName, row.suffix].filter(Boolean).join(" ") || "-"}
                      </td>
                      <td className="text-slate-700">{row.birthDate ?? "-"}</td>
                      <td className="min-w-72 text-slate-700">{row.addressLine || "-"}</td>
                      <td className="text-slate-700">{row.purok ?? "-"}</td>
                      <td>
                        <Status status={row.status} />
                      </td>
                      <td className="min-w-72 text-slate-600">{row.reasons.join(" ") || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {preview.rows.length > 200 ? (
              <p className="border-t border-slate-200 px-5 py-3 text-sm text-slate-500">
                Showing first 200 rows. All valid non-duplicate rows are included when importing.
              </p>
            ) : null}
          </section>
        </>
      ) : null}

      {importState.error ? <Notice tone="danger" message={importState.error} /> : null}
      {result ? (
        <section className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
          <p className="font-semibold">Import completed</p>
          <p className="mt-1">
            Rows read: {result.rowsRead}. Imported: {result.imported}. Duplicates: {result.duplicates}. Invalid: {result.invalid}. Ignored: {result.ignored}.
          </p>
          {result.errorReportCsv ? (
            <a
              download="resident-import-error-report.csv"
              href={`data:text/csv;charset=utf-8,${encodeURIComponent(result.errorReportCsv)}`}
              className="mt-4 inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm font-medium text-emerald-800 shadow-sm"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download Error Report CSV
            </a>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function MappingRow({ mapping }: { mapping: ResidentImportColumnMapping }) {
  return (
    <tr>
      <td className="font-medium text-slate-950">
        <input type="hidden" name="columnIndex" value={mapping.columnIndex} />
        <input type="hidden" name={`header-${mapping.columnIndex}`} value={mapping.originalHeader} />
        <input type="hidden" name={`sample-${mapping.columnIndex}`} value={mapping.sampleValue} />
        <input type="hidden" name={`originalField-${mapping.columnIndex}`} value={mapping.systemField} />
        {mapping.originalHeader}
      </td>
      <td>
        <select
          name={`field-${mapping.columnIndex}`}
          defaultValue={mapping.systemField}
          className="h-10 min-w-56 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700"
        >
          <option value="">Ignore column</option>
          {residentImportFields.map((field) => (
            <option key={field.value} value={field.value}>
              {field.label}
            </option>
          ))}
        </select>
      </td>
      <td className="max-w-xs truncate text-slate-700">{mapping.sampleValue || "-"}</td>
      <td>
        <MappingStatus status={mapping.status} />
      </td>
    </tr>
  );
}

function Metric({ label, value, tone = "neutral" }: { label: string; value: number; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const toneClass = {
    neutral: "text-slate-950",
    success: "text-emerald-700",
    warning: "text-amber-700",
    danger: "text-red-700",
  }[tone];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-3xl font-semibold ${toneClass}`}>{value.toLocaleString()}</p>
    </div>
  );
}

function Status({ status }: { status: "valid" | "duplicate" | "invalid" }) {
  const classes = {
    valid: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    duplicate: "bg-amber-50 text-amber-700 ring-amber-100",
    invalid: "bg-red-50 text-red-700 ring-red-100",
  };

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ring-1 ${classes[status]}`}>{status}</span>;
}

function MappingStatus({ status }: { status: ResidentImportColumnMapping["status"] }) {
  const classes = {
    auto: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    saved: "bg-blue-50 text-blue-700 ring-blue-100",
    manual: "bg-amber-50 text-amber-700 ring-amber-100",
    unmapped: "bg-slate-50 text-slate-600 ring-slate-200",
  };

  return <span className={`rounded-full px-2 py-1 text-xs font-semibold ring-1 ${classes[status]}`}>{statusLabels[status]}</span>;
}

function Notice({ tone, message }: { tone: "success" | "danger"; message: string }) {
  const classes =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-red-200 bg-red-50 text-red-700";

  return (
    <div className={`mt-4 flex items-start gap-3 rounded-md border p-4 text-sm ${classes}`}>
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}

function fieldLabel(field: string) {
  return residentImportFields.find((item) => item.value === field)?.label ?? field;
}
