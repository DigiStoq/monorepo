import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, User } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button, Input } from "@/components/ui";
import { useAuthStore } from "@/stores";

export function SignupPage(): ReactNode {
  const navigate = useNavigate();
  const { signUp, signInWithGoogle, isLoading, error, clearError } =
    useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGoogleSignUp = async (): Promise<void> => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google sign up error", err);
    }
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setFormError(null);
    clearError();

    // Validation
    if (!email.trim()) {
      setFormError("Email is required");
      return;
    }
    if (!password) {
      setFormError("Password is required");
      return;
    }
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    const { error } = await signUp(email, password, name || undefined);

    if (!error) {
      // Check if email confirmation is required
      const authState = useAuthStore.getState();
      if (authState.isAuthenticated) {
        void navigate({ to: "/" });
      } else {
        // Email confirmation required
        setSuccess(true);
      }
    }
  };

  const displayError = formError ?? error?.message;

  if (success) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent you a confirmation link"
      >
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-success-light rounded-full flex items-center justify-center mx-auto">
            <Mail className="h-8 w-8 text-success" />
          </div>
          <p className="text-text-secondary">
            Click the link in your email to confirm your account and start using
            DigiStoq.
          </p>
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create account" subtitle="Get started with DigiStoq">
      <form
        onSubmit={(e) => {
          void handleSubmit(e);
        }}
        className="space-y-5"
      >
        {/* Error Message */}
        {displayError && (
          <div className="bg-error-light text-error text-sm p-3 rounded-lg">
            {displayError}
          </div>
        )}

        {/* Google Sign Up */}
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={() => {
            void handleGoogleSignUp();
          }}
          isLoading={isLoading}
          className="bg-card text-text-secondary border-border-secondary hover:bg-subtle flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 4.36c1.62 0 3.1.56 4.23 1.64l3.18-3.18C17.46 1.05 14.97 0 12 0 7.7 0 3.99 2.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign up with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border-primary" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-text-tertiary">
              Or sign up with email
            </span>
          </div>
        </div>

        {/* Name */}
        <Input
          type="text"
          label="Full name (optional)"
          placeholder="John Doe"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          leftIcon={<User size={18} className="text-text-muted" />}
          autoComplete="name"
          disabled={isLoading}
        />

        {/* Email */}
        <Input
          type="email"
          label="Email address"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
          }}
          leftIcon={<Mail size={18} className="text-slate-400" />}
          autoComplete="email"
          disabled={isLoading}
        />

        {/* Password */}
        <Input
          type="password"
          label="Password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
          leftIcon={<Lock size={18} className="text-slate-400" />}
          showPasswordToggle
          helperText="Must be at least 6 characters"
          autoComplete="new-password"
          disabled={isLoading}
        />

        {/* Confirm Password */}
        <Input
          type="password"
          label="Confirm password"
          placeholder="Confirm your password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
          }}
          leftIcon={<Lock size={18} className="text-slate-400" />}
          showPasswordToggle
          autoComplete="new-password"
          disabled={isLoading}
        />

        {/* Submit Button */}
        <Button type="submit" fullWidth isLoading={isLoading} size="lg">
          Create account
        </Button>

        {/* Login Link */}
        <p className="text-center text-sm text-text-secondary">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
