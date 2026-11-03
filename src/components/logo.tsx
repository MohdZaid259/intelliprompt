import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="text-primary dark:text-foreground flex items-center gap-2 font-mono text-lg font-bold tracking-wide select-none"
    >
      <Image
        src="/logo.png"
        alt=""
        width={24}
        height={24}
        className="ring-muted shadow-primary/30 rounded-md shadow-lg ring-2"
      />
      IntelliPrompt
    </Link>
  );
}
