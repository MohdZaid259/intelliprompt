import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteUrl } from "@/lib/site-url";

// The site-wide share card (WhatsApp, X, LinkedIn, Slack...). Prompt pages have their own.
// Static: rendered once at build time.
export const alt = "IntelliPrompt: better prompts, proven across models";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const font = (weight: number) =>
  readFile(
    join(process.cwd(), `node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff`),
  );

const ANSWERS = [
  { model: "OpenAI", color: "#10a37f", width: [92, 78, 54], time: "1.8s", best: false },
  { model: "Anthropic", color: "#d97757", width: [88, 94, 70], time: "1.4s", best: true },
  { model: "Google", color: "#4f8df7", width: [84, 66, 40], time: "2.1s", best: false },
];

export default async function Image() {
  const [regular, medium, semibold] = await Promise.all([font(400), font(500), font(600)]);
  const domain = new URL(siteUrl()).host.replace(/^www\./, "");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#0b0613",
        color: "white",
        fontFamily: "Inter",
      }}
    >
      {/* soft glow and light rays from above, like the hero */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 420,
          background:
            "linear-gradient(to bottom, rgba(126,34,206,0.38), rgba(126,34,206,0.12) 55%, rgba(126,34,206,0))",
          display: "flex",
        }}
      />
      {[
        { left: 230, w: 110, r: 18 },
        { left: 420, w: 60, r: 8 },
        { left: 560, w: 150, r: 0 },
        { left: 760, w: 70, r: -10 },
        { left: 900, w: 120, r: -18 },
      ].map((ray) => (
        <div
          key={ray.left}
          style={{
            position: "absolute",
            top: -80,
            left: ray.left,
            width: ray.w,
            height: 620,
            transform: `rotate(${ray.r}deg)`,
            transformOrigin: "top center",
            background:
              "linear-gradient(to bottom, rgba(216,180,254,0.13), rgba(216,180,254,0.03) 55%, rgba(216,180,254,0))",
            display: "flex",
          }}
        />
      ))}

      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: "64px 72px",
          gap: 48,
          alignItems: "center",
        }}
      >
        {/* left: brand and promise */}
        <div style={{ display: "flex", flexDirection: "column", width: 600, height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width="44" height="44" viewBox="0 0 24 24">
              <defs>
                <linearGradient id="m" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#a855f7" />
                  <stop offset="1" stopColor="#6d28d9" />
                </linearGradient>
              </defs>
              <rect width="24" height="24" rx="6" fill="url(#m)" />
              <path
                d="M6.5 8 L10.5 12 L6.5 16"
                stroke="#fff"
                strokeWidth="2.2"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M12.5 16 H15.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
              <path
                d="M17.5 3.8 Q18.1 6.8 21 7.4 Q18.1 8 17.5 11 Q16.9 8 14 7.4 Q16.9 6.8 17.5 3.8Z"
                fill="#fff"
              />
            </svg>
            <span style={{ fontSize: 30, fontWeight: 600, letterSpacing: -0.5 }}>IntelliPrompt</span>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: "auto",
              fontSize: 58,
              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: -2,
            }}
          >
            <span>Better prompts,</span>
            <span
              style={{
                backgroundImage: "linear-gradient(90deg, #e9d5ff, #a855f7)",
                backgroundClip: "text",
                color: "transparent",
                whiteSpace: "nowrap",
              }}
            >
              proven across models.
            </span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 26,
              lineHeight: 1.4,
              color: "rgba(255,255,255,0.65)",
            }}
          >
            Enhance a rough idea, test it on top AI models side by side, keep what wins.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: "auto" }}>
            <div
              style={{
                display: "flex",
                padding: "12px 24px",
                borderRadius: 12,
                background: "#9333ea",
                fontSize: 22,
                fontWeight: 500,
                boxShadow: "0 0 40px rgba(168,85,247,0.5)",
              }}
            >
              Try it free
            </div>
            <span style={{ fontSize: 22, color: "rgba(255,255,255,0.5)" }}>{domain}</span>
          </div>
        </div>

        {/* right: a glimpse of the side-by-side comparison */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            gap: 14,
            padding: 22,
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.04)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              borderRadius: 12,
              background: "rgba(168,85,247,0.14)",
              border: "1px solid rgba(168,85,247,0.35)",
              fontSize: 18,
              color: "#e9d5ff",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path d="M12 2 Q13.2 10.8 22 12 Q13.2 13.2 12 22 Q10.8 13.2 2 12 Q10.8 10.8 12 2Z" fill="#c084fc" />
            </svg>
            Write a launch tweet for our app
          </div>

          {ANSWERS.map((a) => (
            <div
              key={a.model}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "16px 18px",
                borderRadius: 14,
                background: a.best ? "rgba(168,85,247,0.10)" : "rgba(255,255,255,0.03)",
                border: a.best
                  ? "1.5px solid rgba(192,132,252,0.7)"
                  : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18 }}>
                <div
                  style={{ display: "flex", width: 12, height: 12, borderRadius: 9999, background: a.color }}
                />
                <span style={{ fontWeight: 500 }}>{a.model}</span>
                <span style={{ marginLeft: "auto", color: "rgba(255,255,255,0.45)", fontSize: 16 }}>
                  {a.time}
                </span>
                {a.best && (
                  <span
                    style={{
                      display: "flex",
                      marginLeft: 8,
                      padding: "3px 10px",
                      borderRadius: 9999,
                      background: "#a855f7",
                      fontSize: 14,
                      fontWeight: 500,
                    }}
                  >
                    Best answer
                  </span>
                )}
              </div>
              {a.width.map((w, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    width: `${w}%`,
                    height: 9,
                    borderRadius: 9999,
                    background: "rgba(255,255,255,0.16)",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Inter", data: regular, weight: 400, style: "normal" },
        { name: "Inter", data: medium, weight: 500, style: "normal" },
        { name: "Inter", data: semibold, weight: 600, style: "normal" },
      ],
    },
  );
}
