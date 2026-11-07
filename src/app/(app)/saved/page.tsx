import { permanentRedirect } from "next/navigation";

// Saved prompts now live in My Library.
export default function SavedPage() {
  permanentRedirect("/library");
}
