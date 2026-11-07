import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The "prompt spark" mark: a prompt cursor (› _) with an AI sparkle.
 * Same artwork as src/app/icon.svg (the favicon).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("size-6 shrink-0", className)} aria-hidden>
      <defs>
        <linearGradient id="ip-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a855f7" />
          <stop offset="1" stopColor="#6d28d9" />
        </linearGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ip-mark)" />
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
  );
}

export function Logo() {
  return (
    <Link
      href="/"
      className="text-primary dark:text-foreground flex items-center gap-2 font-mono text-lg font-bold tracking-wide select-none"
    >
      <LogoMark className="shadow-primary/30 rounded-md shadow-lg" />
      IntelliPrompt
    </Link>
  );
}
