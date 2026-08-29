"use client";

import { TriangleAlert } from "lucide-react";

export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <div className="admin-page">
      <section className="admin-card admin-error" role="alert">
        <TriangleAlert aria-hidden="true" />
        <h1>Admin data could not be loaded</h1>
        <p>The request failed safely. No database details were exposed.</p>
        <button className="admin-button admin-button--primary" type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </div>
  );
}
