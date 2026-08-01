"use client";

import { useActionState } from "react";
import {
  initialTrackRequestState,
  trackPublicRequest,
  type TrackRequestState,
} from "./actions";

export function TrackRequestForm({ barangaySlug, initialRequestNumber = "" }: { barangaySlug: string; initialRequestNumber?: string }) {
  const action = trackPublicRequest.bind(null, barangaySlug);
  const [state, formAction, pending] = useActionState(action, initialTrackRequestState);

  return (
    <>
      <form className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm" action={formAction}>
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="text-sm font-medium text-ink-700">Request number</span>
            <input name="requestNumber" defaultValue={initialRequestNumber} required className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink-700">Contact number</span>
            <input name="contactNumber" required className="mt-1 h-11 w-full rounded-md border border-slate-200 px-3 text-sm" />
          </label>
          <button type="submit" disabled={pending} className="h-11 self-end rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70">
            {pending ? "Checking..." : "Track"}
          </button>
        </div>
      </form>

      <TrackRequestResult state={state} />
    </>
  );
}

function TrackRequestResult({ state }: { state: TrackRequestState }) {
  if (state.status === "idle") {
    return null;
  }

  if (state.status !== "found" || !state.result) {
    return <div className="rounded-md border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">{state.message}</div>;
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Request Status</h2>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <Info label="Request number" value={state.result.trackingCode} />
        <Info label="Certificate type" value={state.result.certificateType} />
        <Info label="Status" value={state.result.requestStatus} />
        <Info label="Submitted date" value={state.result.submittedAt} />
        <Info label="Instructions" value={state.result.instructions} wide />
        <Info label="Submitted notes" value={state.result.notes} wide />
      </dl>
    </section>
  );
}

function Info({ label, value, wide }: { label: string; value?: string | null; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-500">{label}</dt>
      <dd className="mt-1 text-sm text-ink-900">{value || "-"}</dd>
    </div>
  );
}
