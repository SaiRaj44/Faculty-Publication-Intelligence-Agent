import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { approvePublication, rejectPublication } from '../../actions';

export default async function PublicationDetail({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const resolvedParams = await params;

  const publication = await prisma.publication.findUnique({
    where: { id: resolvedParams.id },
    include: {
      faculty: { select: { name: true, email: true, employeeId: true } },
      department: { select: { name: true } },
      metadata: { orderBy: { createdAt: 'desc' } },
      validationResult: true
    }
  });

  if (!publication) {
    notFound();
  }

  // RBAC checks
  if (session.user.role === 'FACULTY' && publication.facultyId !== session.user.facultyId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-red-500 font-medium">
        Forbidden: You do not have permission to view this publication.
      </div>
    );
  }

  const canApprove = session.user.role === 'SUPER_ADMIN' || session.user.role === 'INSTITUTION_ADMIN' || session.user.role === 'HOD';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="text-brand-600 hover:underline flex items-center gap-2">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex-1 truncate">
            Publication Details
          </h1>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            publication.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
            publication.status === 'APPROVED' || publication.status === 'VALIDATED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            publication.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
          }`}>
            {publication.status}
          </span>
          {publication.status === 'PENDING' && canApprove && (
            <div className="flex items-center gap-3 ml-4">
              <form action={approvePublication.bind(null, publication.id)}>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm">
                  Approve
                </button>
              </form>
              <form action={rejectPublication.bind(null, publication.id)}>
                <button type="submit" className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 rounded-lg font-medium transition-colors">
                  Reject
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="glass-card p-8 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
            {publication.title}
          </h2>
          {publication.authors && publication.authors.length > 0 && (
            <p className="text-slate-600 dark:text-slate-300 font-medium mb-6">
              Authors: {publication.authors.join(', ')}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
            <div className="space-y-4">
              <div>
                <span className="block text-slate-500 dark:text-slate-400 mb-1">Journal / Conference</span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {publication.journalName || publication.conferenceName || 'N/A'}
                </span>
              </div>
              <div>
                <span className="block text-slate-500 dark:text-slate-400 mb-1">Publisher</span>
                <span className="font-medium text-slate-900 dark:text-white">{publication.publisher || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-slate-500 dark:text-slate-400 mb-1">DOI</span>
                <span className="font-medium text-brand-600 dark:text-brand-400">
                  {publication.doi ? <a href={`https://doi.org/${publication.doi}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{publication.doi}</a> : 'N/A'}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <span className="block text-slate-500 dark:text-slate-400 mb-1">Year</span>
                <span className="font-medium text-slate-900 dark:text-white">{publication.year || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-slate-500 dark:text-slate-400 mb-1">Publication Type</span>
                <span className="font-medium text-slate-900 dark:text-white">{publication.publicationType?.replace('_', ' ') || 'N/A'}</span>
              </div>
              <div>
                <span className="block text-slate-500 dark:text-slate-400 mb-1">Citations</span>
                <span className="font-medium text-slate-900 dark:text-white">{publication.citationCount}</span>
              </div>
            </div>
          </div>
        </div>

        {publication.abstract && (
          <div className="glass-card p-8 mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Abstract</h3>
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {publication.abstract}
            </p>
          </div>
        )}

        <div className="glass-card p-8">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Internal Meta</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Submitted By:</span>{' '}
              <span className="font-medium text-slate-900 dark:text-white">{publication.faculty?.name || 'Unknown'}</span>
            </div>
            <div>
              <span className="text-slate-500">Department:</span>{' '}
              <span className="font-medium text-slate-900 dark:text-white">{publication.department?.name || 'Unknown'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
