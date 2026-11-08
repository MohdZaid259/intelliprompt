import { SignIn } from "@clerk/nextjs";

// Signing in with Google for the first time creates an account here too: send those to Explore.
export default function SignInPage() {
  return <SignIn signUpForceRedirectUrl="/explore" />;
}
