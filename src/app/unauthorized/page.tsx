import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="glass-card p-12 text-center max-w-lg w-full animate-slide-up">
        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          ⚠️
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Access Denied
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-8">
          You do not have permission to view this page. Please contact your institution administrator if you believe this is a mistake.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
