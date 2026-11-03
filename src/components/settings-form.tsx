"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSettingsAction } from "@/server/actions/account";
import type { Settings } from "@/server/data/users";

export function SettingsForm({ initial }: { initial: Settings }) {
  const [settings, setSettings] = useState(initial);
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<Settings>) => setSettings((s) => ({ ...s, ...patch }));

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateSettingsAction(settings);
      if (result.ok) toast.success("Settings saved");
      else toast.error(result.error);
    });
  };

  return (
    <form onSubmit={save} className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          value={settings.bio}
          maxLength={160}
          onChange={(e) => set({ bio: e.target.value })}
          placeholder="What do you build with prompts?"
        />
        <p className="text-muted-foreground text-xs">
          Shown on your public profile. {160 - settings.bio.length} characters left.
        </p>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-2 text-sm font-medium">Email</legend>
        <Checkbox
          label="When someone I follow publishes a prompt"
          checked={settings.followUpdates}
          onChange={(followUpdates) => set({ followUpdates })}
        />
        <Checkbox
          label="IntelliPrompt news and announcements (occasional)"
          checked={settings.newsletter}
          onChange={(newsletter) => set({ newsletter })}
        />
      </fieldset>

      <Button type="submit" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />} Save
      </Button>
    </form>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-3 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-primary size-4"
      />
      {label}
    </label>
  );
}
