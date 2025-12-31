import { useState, type FormEvent, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button, Input } from "@/components/ui";
import { useAuthStore } from "@/stores";

export function ForgotPasswordPage(): ReactNode {
  const { resetPassword, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
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

    const { error } = await resetPassword(email);

    if (!error) {
      setSuccess(true);
    }
  };

  const displayError = formError ?? error?.message;

  if (success) {
    return (
      <AuthLayout title="Check your email" subtitle="Password reset link sent">
        <div className="text-center space-y-4">
          <div className="h-16 w-16 bg-success-light rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <p className="text-slate-600">
            We&apos;ve sent a password reset link to <strong>{email}</strong>.
            Click the link in the email to reset your password.
          </p>
          <div className="pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium"
            >
              <ArrowLeft size={16} />
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset password"
      subtitle="Enter your email and we'll send you a reset link"
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

        {/* Submit Button */}
        <Button type="submit" fullWidth isLoading={isLoading} size="lg">
          Send reset link
        </Button>

        {/* Back to Login */}
        <div className="text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
