import { Suspense } from "react";

// Clerk's <SignIn>/<SignUp> read the URL, so they stream in behind a boundary.
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <Suspense>{children}</Suspense>
    </main>
  );
}
