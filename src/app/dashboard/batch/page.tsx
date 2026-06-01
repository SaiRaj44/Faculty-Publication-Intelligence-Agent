'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BatchUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/batch/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process batch upload');
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Batch Upload</h1>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
            Upload CSV or Excel
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
            Upload a list of DOIs or publication details. The AI agent will validate and enrich all records concurrently.
          </p>

          <form onSubmit={handleUpload} className="flex flex-col gap-6">
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 text-center hover:border-brand-500 transition-colors cursor-pointer bg-white dark:bg-slate-900">
              <input 
                type="file" 
                accept=".csv,.xlsx" 
                onChange={handleFileChange}
                className="w-full text-slate-900 dark:text-white"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading || !file}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors w-full"
            >
              {loading ? 'Processing...' : 'Upload & Process'}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-8 p-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <h3 className="text-lg font-bold text-green-900 dark:text-green-300 mb-2">Upload Successful</h3>
              <p className="text-green-800 dark:text-green-400 text-sm mb-4">
                {result.message}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                  <p className="text-xs text-slate-500">Total Processed</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">{result.stats?.total || 0}</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm">
                  <p className="text-xs text-slate-500">Failed / Flagged</p>
                  <p className="text-xl font-bold text-red-600 dark:text-red-400">{result.stats?.failed || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
