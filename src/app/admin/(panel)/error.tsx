"use client";
import { useEffect } from "react";
import { ErrorState } from "@/components/admin/ui";

/** Any admin page that fails to load shows this instead of a blank screen. */
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <div className="card rounded-card">
      <ErrorState
        action={
          <button type="button" className="btn-primary btn-sm" onClick={reset}>
            Try again
          </button>
        }
      >
        This page couldn&apos;t load. Try again; if it keeps happening, note the time{error.digest ? ` and code ${error.digest}` : ""} and contact your developer.
      </ErrorState>
    </div>
  );
}
