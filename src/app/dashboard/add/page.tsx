'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AddPublication() {
  const router = useRouter();
  const [doi, setDoi] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleEnrich = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/publications/enrich', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: { doi }
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to enrich publication');
      }
      
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/publications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: result?.data?.title || result?.publication?.title || 'Unknown Title',
          doi: doi,
          year: result?.data?.year || new Date().getFullYear(),
          authors: result?.data?.authors || [],
          journalName: result?.data?.journalName || '',
          publicationType: 'INTERNATIONAL_JOURNAL',
          facultyId: 'temp', // Will be overridden by session on server
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to save publication');
      }
      
      router.push('/dashboard');
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add Publication</h1>
        </div>

        <div className="glass-card p-8">
          <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
            Smart Import via DOI
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
            Enter a DOI, and our AI agent will fetch metadata from Crossref, Scopus, and Google Scholar to automatically populate the publication details.
          </p>

          <form onSubmit={handleEnrich} className="flex gap-4">
            <input
              type="text"
              placeholder="e.g., 10.1109/TNNLS.2023.1234567"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
              required
              className="flex-1 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !doi}
              className="px-6 py-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
            >
              {loading ? 'Enriching...' : 'Fetch & Enrich'}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          {result && (
            <div className="mt-8">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Enriched Results</h3>
              <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-4 overflow-auto max-h-96">
                <pre className="text-xs text-slate-800 dark:text-slate-300">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="mt-6 w-full px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                {loading ? 'Saving...' : 'Save Publication'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
