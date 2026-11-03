"use client";

import { Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { recordShareAction } from "@/server/actions/community";

type Channel = "link" | "x" | "linkedin" | "whatsapp";

export function ShareMenu({
  promptId,
  title,
  count,
  signedIn,
}: {
  promptId: string;
  title: string;
  count: number;
  signedIn: boolean;
}) {
  const [shares, setShares] = useState(count);

  const share = async (channel: Channel) => {
    const url = `${window.location.origin}/p/${promptId}`;
    const text = encodeURIComponent(`${title} — on IntelliPrompt`);
    const link = encodeURIComponent(url);
    const targets: Record<Exclude<Channel, "link">, string> = {
      x: `https://x.com/intent/post?text=${text}&url=${link}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${link}`,
      whatsapp: `https://wa.me/?text=${text}%20${link}`,
    };
    if (channel === "link") {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } else {
      window.open(targets[channel], "_blank", "noopener,noreferrer");
    }
    // only signed-in shares are counted, so counts can't be inflated anonymously
    if (signedIn) {
      const result = await recordShareAction({ promptId, channel });
      if (result.ok) setShares(result.data.count);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground gap-1.5 px-2"
          aria-label="Share"
        >
          <Share2 />
          <span className="tabular-nums">{shares}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onSelect={() => share("link")}>Copy link</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => share("x")}>Share on X</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => share("linkedin")}>Share on LinkedIn</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => share("whatsapp")}>Share on WhatsApp</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
