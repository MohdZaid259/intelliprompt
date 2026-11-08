import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { AnalyticsIdentify } from "@/components/analytics-identify";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

// One text font everywhere (Inter); Geist Mono only for code.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "Turn rough ideas into sharp prompts, test them on GPT, Claude, Gemini and more side by side, and keep every version. Free to start.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  applicationName: "IntelliPrompt",
  title: {
    default: "IntelliPrompt · Better prompts, proven across models",
    template: "%s · IntelliPrompt",
  },
  description: DESCRIPTION,
  keywords: [
    "prompt engineering",
    "AI prompts",
    "prompt enhancer",
    "compare LLMs",
    "ChatGPT prompts",
    "Claude prompts",
    "Gemini prompts",
    "prompt library",
  ],
  openGraph: {
    type: "website",
    siteName: "IntelliPrompt",
    locale: "en_US",
    title: "IntelliPrompt · Better prompts, proven across models",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "IntelliPrompt · Better prompts, proven across models",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        suppressHydrationWarning
        className={`${geistMono.variable} ${inter.variable} h-full antialiased`}
      >
        <body className="flex min-h-full flex-col">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <AnalyticsIdentify />
            <Analytics />
            <SpeedInsights />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
