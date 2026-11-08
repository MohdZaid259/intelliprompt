"use client";

import { useUser } from "@clerk/nextjs";
import posthog from "posthog-js";
import { useEffect } from "react";

/** Ties PostHog events and replays to the signed-in user; forgets them on sign-out. */
export function AnalyticsIdentify() {
  const { isLoaded, user } = useUser();

  useEffect(() => {
    if (!isLoaded || !process.env.NEXT_PUBLIC_POSTHOG_KEY) return;
    if (user) {
      if (posthog.get_distinct_id() !== user.id) {
        posthog.identify(user.id, {
          email: user.primaryEmailAddress?.emailAddress,
          username: user.username,
          name: user.fullName,
        });
      }
    } else if (posthog._isIdentified()) {
      posthog.reset();
    }
  }, [isLoaded, user]);

  return null;
}
