import { ImageResponse } from "next/og";
import { idSchema } from "@/lib/validation";
import { getPromptCard } from "@/server/public-card";

export const alt = "Prompt on IntelliPrompt";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const card = idSchema.safeParse(id).success ? await getPromptCard(id) : null;
  const title = card?.title ?? "IntelliPrompt";
  const preview = card ? card.preview.slice(0, 180) : "Better prompts, proven across models.";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        background: "linear-gradient(135deg, #1a1025 0%, #2d1650 100%)",
        color: "white",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", fontSize: 28, color: "#c9a6ff", fontWeight: 700 }}>
        IntelliPrompt
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.1 }}>
          {title}
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#d4d4d8", lineHeight: 1.4 }}>
          {preview}
        </div>
      </div>
      <div style={{ display: "flex", gap: 32, fontSize: 26, color: "#a1a1aa" }}>
        {card && <span>@{card.author.username}</span>}
        {card && <span>♥ {card.likes}</span>}
      </div>
    </div>,
    size,
  );
}
