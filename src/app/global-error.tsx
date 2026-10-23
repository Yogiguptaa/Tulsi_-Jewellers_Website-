"use client";

import { useEffect } from "react";

/** Root error boundary — must render its own <html> and <body>. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF6EE",
          color: "#1F1B16",
          fontFamily: "Georgia, serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <div>
          <h1 style={{ color: "#5A0F1B", marginBottom: "0.5rem" }}>Something went wrong</h1>
          <p style={{ color: "#1F1B16B3", marginBottom: "1.5rem" }}>
            Please try again. If the problem keeps happening, contact Tulsi Jewellers.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#5A0F1B",
              color: "#FFFDF8",
              border: "none",
              padding: "0.75rem 1.5rem",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
