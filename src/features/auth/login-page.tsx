import { useState, useEffect, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button, Input } from "@/components/ui";
import { useAuthStore } from "@/stores";

export function LoginPage(): ReactNode {
  const navigate = useNavigate();
  const {
    signIn,
    signInWithGoogle,
    isLoading,
    error,
    clearError,
    isAuthenticated,
  } = useAuthStore();

  // Redirect when authenticated (e.g. after Google Sign In)
  useEffect(() => {
    if (isAuthenticated) {
      void navigate({ to: "/" });
    }
  }, [isAuthenticated, navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const handleGoogleSignIn = async (): Promise<void> => {
    try {
      await signInWithGoogle();
    } catch (err) {
      console.error("Google sign in error", err);
    }
  };

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
        <Button
          type="button"
          variant="outline"
          fullWidth
          onClick={() => {
            void handleGoogleSignIn();
          }}
          isLoading={isLoading}
          className="bg-white text-slate-700 border-slate-300 hover:bg-slate-50 flex items-center justify-center gap-2"
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
          Sign in with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-slate-500">
              Or continue with
            </span>
          </div>
        </div>

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
