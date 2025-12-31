import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, User } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button, Input } from "@/components/ui";
import { useAuthStore } from "@/stores";

export function SignupPage(): ReactNode {
  const navigate = useNavigate();
  const { signUp, isLoading, error, clearError } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
          <p className="text-slate-600">
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

        {/* Name */}
        <Input
          type="text"
          label="Full name (optional)"
          placeholder="John Doe"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
          }}
          leftIcon={<User size={18} className="text-slate-400" />}
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
        <p className="text-center text-sm text-slate-600">
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
