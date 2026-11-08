import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, SupportEmail } from "@/components/legal/legal-page";
import { LEGAL } from "@/config/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "What IntelliPrompt collects, why, who processes it and how to delete it.",
  alternates: { canonical: "/privacy" },
};

const PROCESSORS = [
  [
    "Clerk",
    "Sign-up, sign-in and account security",
    "Name, email, username, profile photo, sign-in data",
  ],
  [
    "Razorpay",
    "Payments",
    "Payment details you enter at checkout (we never see or store your card or UPI details)",
  ],
  [
    "OpenRouter and the AI model providers it routes to (such as OpenAI, Anthropic, Google)",
    "Enhancing prompts and generating answers",
    "The text of prompts you enhance or run",
  ],
  ["Resend", "Sending emails", "Your email address and the email content"],
  ["Neon", "Database hosting", "Your account data and content"],
  [
    "Vercel",
    "Hosting, privacy-friendly analytics and performance monitoring",
    "Request data such as IP address, browser and pages visited",
  ],
  [
    "PostHog",
    "Product analytics and session replays, to see how people use the app and fix problems",
    "Pages visited, clicks, a recording of your screen in the app (typed text hidden), your user ID, username and email",
  ],
  [
    "Railway",
    "Background email jobs and rate limiting",
    "Your user ID and email address while a job runs",
  ],
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro={`This policy explains what ${LEGAL.name} collects, how we use it, and the choices you have.`}
    >
      <h2>1. What we collect</h2>
      <ul>
        <li>
          <strong>Account information:</strong> your name, email address, username and profile
          photo, received from our sign-in provider when you sign up, plus a bio if you add one.
        </li>
        <li>
          <strong>Your content:</strong> prompts, versions, folders, model answers from your runs,
          and your comments, likes, saves and follows.
        </li>
        <li>
          <strong>Usage information:</strong> how many runs and enhancements you use each day, their
          token counts and cost, and your activity streak. We use these to apply plan limits.
        </li>
        <li>
          <strong>Payment records:</strong> the plan you bought, the amount, and Razorpay&apos;s
          order and payment IDs. Card, bank and UPI details are handled by Razorpay and never reach
          us.
        </li>
        <li>
          <strong>Email preferences:</strong> whether you want the newsletter and updates from
          people you follow.
        </li>
        <li>
          <strong>Technical data:</strong> IP address, browser and device information, kept in
          server logs and used for security and to fix problems.
        </li>
      </ul>

      <h2>2. How we use it</h2>
      <ul>
        <li>To run the Service: sign you in, save your work and show it to you.</li>
        <li>To send your prompts to AI models when you ask us to enhance or run them.</li>
        <li>To show your published prompts, username and profile on public pages.</li>
        <li>To process payments and apply your plan and its limits.</li>
        <li>
          To send emails: account and billing messages, notifications you have turned on, and the
          newsletter if you opted in. Every optional email has an unsubscribe link.
        </li>
        <li>To keep the Service secure, prevent abuse and understand how it is used.</li>
      </ul>
      <p>
        We don&apos;t sell your personal data, and we don&apos;t use it for advertising. We
        don&apos;t use your private prompts to train AI models.
      </p>

      <h2>3. Public and private content</h2>
      <p>
        Prompts are private unless you publish them. Published prompts, along with your username,
        name, photo and bio, can be seen by anyone, including people who aren&apos;t signed in, and
        may be indexed by search engines. You can unpublish a prompt at any time.
      </p>

      <h2>4. Third-party services</h2>
      <p>We share data only with the services that help us run IntelliPrompt:</p>
      <div className="not-prose overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="p-3 font-medium">Service</th>
              <th className="p-3 font-medium">Purpose</th>
              <th className="p-3 font-medium">Data</th>
            </tr>
          </thead>
          <tbody>
            {PROCESSORS.map(([name, purpose, data]) => (
              <tr key={name} className="border-t align-top">
                <td className="p-3 font-medium">{name}</td>
                <td className="text-muted-foreground p-3">{purpose}</td>
                <td className="text-muted-foreground p-3">{data}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Each service processes data under its own privacy policy, and some are located outside
        India, so your data may be processed in other countries. AI providers handle prompt text
        under their API terms.
      </p>

      <h2>5. Cookies and analytics</h2>
      <p>
        We use cookies to keep you signed in and secure. Your theme choice is stored in your
        browser.
      </p>
      <p>
        We use PostHog to understand how the app is used: which pages people visit and what they
        click. PostHog may also record sessions, a replay of what happened on screen, so we can find
        confusing screens and bugs. Text you type into fields, such as your prompts, is hidden in
        these replays. PostHog stores an identifier in your browser for this. Vercel&apos;s
        analytics and performance monitoring are cookieless. None of this is used for advertising or
        to track you across other websites.
      </p>

      <h2>6. Storage and security</h2>
      <p>
        Your data is stored with the providers above, encrypted in transit (HTTPS). Access is
        limited to what is needed to run the Service. No system is perfectly secure, but we take
        reasonable steps to protect your data and will tell you if a breach affects you.
      </p>

      <h2>7. Retention and deletion</h2>
      <ul>
        <li>We keep your account and content while your account exists.</li>
        <li>
          You can delete individual prompts, versions, folders and comments in the app at any time.
        </li>
        <li>
          To delete your account, email <SupportEmail /> from the address on your account. We delete
          your account, prompts, runs and activity within 30 days.
        </li>
        <li>
          Payment records are kept, without a link to your account, for as long as tax and
          accounting law requires.
        </li>
        <li>Server logs are kept for a limited time and then deleted automatically.</li>
      </ul>

      <h2>8. Your rights</h2>
      <p>
        You can ask to access, correct or delete your personal data, or withdraw consent for
        optional emails. Most of this you can do yourself in <Link href="/settings">Settings</Link>;
        for anything else, email <SupportEmail />. We reply within 30 days.
      </p>

      <h2>9. Children</h2>
      <p>
        The Service is not meant for children. We don&apos;t knowingly collect data from anyone
        under 18 without a parent or guardian&apos;s consent. If you think a child has given us
        data, contact us and we will delete it.
      </p>

      <h2>10. Changes</h2>
      <p>
        If we change this policy we will update the date at the top, and tell you by email or in the
        app before a significant change takes effect.
      </p>

      <h2>11. Contact</h2>
      <p>
        Privacy questions and requests: <SupportEmail />.
        {LEGAL.operator && ` This Service is operated by ${LEGAL.operator}.`}
      </p>
    </LegalPage>
  );
}
