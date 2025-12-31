import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button, Input } from "@/components/ui";
import { useAuthStore } from "@/stores";

export function LoginPage(): ReactNode {
  const navigate = useNavigate();
  const { signIn, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setFormError(null);
    clearError();

    // Basic validation
    if (!email.trim()) {
      setFormError("Email is required");
      return;
    }
    if (!password) {
      setFormError("Password is required");
      return;
    }

    const { error } = await signIn(email, password);

    if (!error) {
      void navigate({ to: "/" });
    }
  };

  const displayError = formError ?? error?.message;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your DigiStoq account"
    >
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
          placeholder="Enter your password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
          leftIcon={<Lock size={18} className="text-slate-400" />}
          showPasswordToggle
          autoComplete="current-password"
          disabled={isLoading}
        />

        {/* Forgot Password Link */}
        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <Button type="submit" fullWidth isLoading={isLoading} size="lg">
          Sign in
        </Button>

        {/* Signup Link */}
        <p className="text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
