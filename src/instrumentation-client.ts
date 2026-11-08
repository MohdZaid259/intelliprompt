import posthog from "posthog-js";

// Product analytics and session replay (PostHog). Off unless NEXT_PUBLIC_POSTHOG_KEY is set.
// Events go through our own /ingest path (see next.config.ts) so ad blockers don't drop them.
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key) {
  try {
    posthog.init(key, {
      api_host: "/ingest",
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST ?? "https://us.posthog.com",
      defaults: "2026-08-30", // pageviews on client-side navigation, page leave, web vitals
      person_profiles: "identified_only",
      session_recording: {
        // typed text (prompts, settings) is hidden in replays; clicks and navigation are kept
        maskAllInputs: true,
      },
    });
  } catch (err) {
    console.error("[posthog] init failed", err);
  }
}
