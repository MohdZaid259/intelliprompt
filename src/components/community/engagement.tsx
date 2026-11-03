"use client";

import { Bookmark, Heart } from "lucide-react";
import { toggleLikeAction, toggleSaveAction } from "@/server/actions/community";
import { ToggleCount } from "./toggle-count";

export function LikeButton({
  promptId,
  liked,
  count,
  signedIn,
}: {
  promptId: string;
  liked: boolean;
  count: number;
  signedIn: boolean;
}) {
  return (
    <ToggleCount
      initial={{ active: liked, count }}
      label="Like"
      activeLabel="Unlike"
      icon={Heart}
      activeClassName="fill-red-500 text-red-500"
      signedIn={signedIn}
      action={() => toggleLikeAction({ promptId })}
    />
  );
}

export function SaveButton({
  promptId,
  saved,
  count,
  signedIn,
}: {
  promptId: string;
  saved: boolean;
  count: number;
  signedIn: boolean;
}) {
  return (
    <ToggleCount
      initial={{ active: saved, count }}
      label="Save"
      activeLabel="Remove from saved"
      icon={Bookmark}
      activeClassName="fill-primary text-primary"
      signedIn={signedIn}
      action={() => toggleSaveAction({ promptId })}
    />
  );
}
