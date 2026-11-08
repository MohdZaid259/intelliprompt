import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL } from "@/config/legal";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get help with your IntelliPrompt account, billing or privacy.",
  alternates: { canonical: "/contact" },
};

const TOPICS = [
  { title: "Account and support", body: "Problems signing in, bugs or questions about features." },
  { title: "Billing and refunds", body: "Include your Razorpay payment ID from the receipt." },
  { title: "Privacy and data", body: "Access, correction or account deletion requests." },
];

export default function ContactPage() {
  const details = [
    { icon: Mail, label: "Email", value: LEGAL.email, href: `mailto:${LEGAL.email}` },
    LEGAL.phone && {
      icon: Phone,
      label: "Phone",
      value: LEGAL.phone,
      href: `tel:${LEGAL.phone.replace(/\s/g, "")}`,
    },
    LEGAL.address && { icon: MapPin, label: "Address", value: LEGAL.address },
    { icon: Clock, label: "Response time", value: "Within 2 business days (Mon–Fri)" },
  ].filter((d) => !!d);

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-4">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Contact us</h1>
        <p className="text-muted-foreground">
          We&apos;re a small team and read every message.
          {LEGAL.operator && ` ${LEGAL.name} is operated by ${LEGAL.operator}.`}
        </p>
      </header>

      <ul className="divide-y rounded-xl border">
        {details.map((d) => (
          <li key={d.label} className="flex items-start gap-4 p-5">
            <d.icon className="text-primary mt-0.5 size-5 shrink-0" />
            <div>
              <p className="text-muted-foreground text-sm">{d.label}</p>
              {"href" in d && d.href ? (
                <a href={d.href} className="font-medium hover:underline">
                  {d.value}
                </a>
              ) : (
                <p className="font-medium whitespace-pre-line">{d.value}</p>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="grid gap-4 sm:grid-cols-3">
        {TOPICS.map((t) => (
          <div key={t.title} className="rounded-xl border p-5">
            <p className="font-medium">{t.title}</p>
            <p className="text-muted-foreground mt-1 text-sm">{t.body}</p>
          </div>
        ))}
      </div>

      <p className="text-muted-foreground text-sm">
        See also our{" "}
        <Link className="text-primary hover:underline" href="/terms">
          Terms
        </Link>
        ,{" "}
        <Link className="text-primary hover:underline" href="/privacy">
          Privacy Policy
        </Link>{" "}
        and{" "}
        <Link className="text-primary hover:underline" href="/refund-policy">
          Refund Policy
        </Link>
        .
      </p>
    </div>
  );
}
