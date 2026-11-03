"use client";

// Last-resort boundary for errors in the root layout; renders its own document.
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
        }}
      >
        <title>Something went wrong · IntelliPrompt</title>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: 20 }}>Something went wrong</h1>
          <button
            onClick={() => retry()}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background: "#aa44ff",
              color: "white",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
