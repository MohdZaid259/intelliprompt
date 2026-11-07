"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "@/components/ui/button";

/** "My prompts" for signed-in visitors, "Sign in" otherwise; the landing page itself stays static. */
export function LandingAccountLink() {
  const { isSignedIn } = useAuth();
  return (
    <Button asChild variant="ghost">
      {isSignedIn ? <Link href="/prompts">My prompts</Link> : <Link href="/sign-in">Sign in</Link>}
    </Button>
  );
}
