import { useRouter } from "@tanstack/react-router";

export function ErrorPage({ error }: { error: Error }): JSX.Element {
  const router = useRouter();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center bg-slate-50">
      <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-3xl text-red-600">⚠️</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2 font-display">
        Something went wrong
      </h1>
      <p className="text-slate-500 mb-6 max-w-md bg-white p-4 rounded border border-slate-200 shadow-sm font-mono text-sm break-all">
        {error.message}
      </p>
      <div className="flex gap-4">
        <button
          onClick={() => {
            window.history.back();
          }}
          className="px-4 py-2 bg-white text-slate-700 border border-slate-300 font-medium rounded-lg hover:bg-slate-50 transition-colors"
        >
          Go Back
        </button>
        <button
          onClick={() => {
            void router.invalidate();
          }}
          className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
