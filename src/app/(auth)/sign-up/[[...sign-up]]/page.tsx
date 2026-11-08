import { SignUp } from "@clerk/nextjs";

// New accounts start on Explore, to see what others built before writing their own.
export default function SignUpPage() {
  return <SignUp forceRedirectUrl="/explore" signInFallbackRedirectUrl="/prompts" />;
}
