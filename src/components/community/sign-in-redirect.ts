"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Returns a function that sends a signed-out visitor to sign in, then back to this page. */
export function useGoToSignIn() {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams().toString();
  return () => {
    const back = encodeURIComponent(search ? `${pathname}?${search}` : pathname);
    router.push(`/sign-in?redirect_url=${back}`);
  };
}
