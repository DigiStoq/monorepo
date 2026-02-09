import { Link } from "@tanstack/react-router";

export function NotFoundPage(): JSX.Element {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-slate-50">
      <div className="h-24 w-24 bg-slate-200 rounded-full flex items-center justify-center mb-6">
        <span className="text-4xl">🤔</span>
      </div>
      <h1 className="text-4xl font-bold text-slate-900 mb-2 font-display">
        404
      </h1>
      <h2 className="text-xl font-semibold text-slate-700 mb-4">
        Page Not Found
      </h2>
      <p className="text-slate-500 mb-8 max-w-sm">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        to="/"
        className="px-6 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
      >
        Go Back Home
      </Link>
    </div>
  );
}
