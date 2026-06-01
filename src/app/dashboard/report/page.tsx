'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function GenerateReport() {
  const [departmentId, setDepartmentId] = useState('');
  const [year, setYear] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // Build query params
      const params = new URLSearchParams();
      if (departmentId) params.append('departmentId', departmentId);
      if (year) params.append('year', year);

      const res = await fetch(`/api/reports/generate?${params.toString()}`, {
        method: 'GET',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="text-brand-600 hover:underline">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Generate Report</h1>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
            Custom Report Builder
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
            Generate insights and reports based on publication data. Leave fields blank to include all data.
          </p>

          <form onSubmit={handleGenerate} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Department ID (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g., dep_123"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Year (Optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g., 2024"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="mt-4 px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-8 border-t border-slate-200 dark:border-slate-800 pt-8">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Report Output</h3>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg">
                  <p className="text-xs text-slate-500">Total Publications</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.summary?.totalPublications || 0}</p>
                </div>
                <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-lg">
                  <p className="text-xs text-slate-500">Average Citations</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.summary?.averageCitations || 0}</p>
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-xs text-slate-800 dark:text-slate-300">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
              
              <button 
                onClick={() => window.print()}
                className="mt-6 w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Download PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
