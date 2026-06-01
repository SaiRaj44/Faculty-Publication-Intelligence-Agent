import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PublicationStatus, UserRole } from '@prisma/client';
import { approvePublication, rejectPublication } from './actions';

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const institutionId = session.user.institutionId!;
  const listWhere: any = { institutionId };
  
  if (session.user.role === UserRole.FACULTY && session.user.facultyId) {
    listWhere.facultyId = session.user.facultyId;
  } else if (session.user.role === UserRole.HOD && session.user.facultyId) {
    const faculty = await prisma.faculty.findUnique({ where: { id: session.user.facultyId } });
    if (faculty) {
      listWhere.departmentId = faculty.departmentId;
    }
  }

  const countWhere: any = {
    ...listWhere,
    status: { not: PublicationStatus.REJECTED }
  };

  // Fetch real stats (excluding REJECTED)
  const [totalPublications, pendingValidation, thisYearTotal, totalCitations] = await Promise.all([
    prisma.publication.count({ where: countWhere }),
    prisma.publication.count({ where: { ...listWhere, status: PublicationStatus.PENDING } }), // Pending uses listWhere because we exactly want PENDING
    prisma.publication.count({ where: { ...countWhere, year: new Date().getFullYear() } }),
    prisma.publication.aggregate({ where: countWhere, _sum: { citationCount: true } })
  ]);

  // Fetch real recent publications (including REJECTED so users can see what was rejected)
  const recentPublications = await prisma.publication.findMany({
    where: listWhere,
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      faculty: { select: { name: true } }
    }
  });

  const canApprove = session.user.role === UserRole.SUPER_ADMIN || session.user.role === UserRole.INSTITUTION_ADMIN || session.user.role === UserRole.HOD;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Navbar */}
      <nav className="glass sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Publication<span className="text-brand-500">Intelligence</span>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              Welcome, {session.user?.name}
            </span>
            <Link 
              href="/api/auth/signout"
              className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              Sign out
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Dashboard Overview</h2>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 animate-slide-up">
          <StatCard title="Total Publications" value={totalPublications} icon="📚" />
          <StatCard title="Pending Validation" value={pendingValidation} icon="⏳" />
          <StatCard title="Published This Year" value={thisYearTotal} icon="📈" />
          <StatCard title="Total Citations" value={totalCitations._sum.citationCount || 0} icon="⭐" />
        </div>

        {/* Quick Actions */}
        <div className="glass-card p-8 animate-slide-up mb-12" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/dashboard/add" className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors">
              + Add Publication
            </Link>
            <Link href="/dashboard/batch" className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium transition-colors">
              Batch Upload (CSV)
            </Link>
            <Link href="/dashboard/report" className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium transition-colors">
              Generate Report
            </Link>
          </div>
        </div>

        {/* Recent Publications Table (Live Data) */}
        <div className="glass-card p-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Recent Publications</h3>
            <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-medium">
              {pendingValidation} Pending Validation
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400">
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium">Authors</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentPublications.map((pub) => (
                  <tr key={pub.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <td className="py-4 text-slate-900 dark:text-white font-medium max-w-xs truncate" title={pub.title}>{pub.title}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-300 truncate max-w-[150px]">{pub.authors?.join(', ') || (pub.faculty?.name || 'Unknown')}</td>
                    <td className="py-4 text-slate-600 dark:text-slate-300">{pub.year || 'N/A'}</td>
                    <td className="py-4">
                      {pub.status === 'PENDING' && <span className="px-2 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-md text-xs">Pending</span>}
                      {pub.status === 'APPROVED' && <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-md text-xs">Approved</span>}
                      {pub.status === 'REJECTED' && <span className="px-2 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-md text-xs">Rejected</span>}
                      {pub.status === 'VALIDATED' && <span className="px-2 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-md text-xs">Validated</span>}
                      {pub.status === 'ENRICHING' && <span className="px-2 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-md text-xs">Enriching</span>}
                      {pub.status === 'FLAGGED' && <span className="px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 rounded-md text-xs">Flagged</span>}
                    </td>
                    <td className="py-4 text-right flex gap-3 justify-end items-center">
                      {pub.status === 'PENDING' && canApprove ? (
                        <>
                          <form action={approvePublication.bind(null, pub.id)}>
                            <button type="submit" className="text-green-600 hover:underline">Approve</button>
                          </form>
                          <form action={rejectPublication.bind(null, pub.id)}>
                            <button type="submit" className="text-red-600 hover:underline">Reject</button>
                          </form>
                        </>
                      ) : (
                        <Link href={`/dashboard/publications/${pub.id}`} className="text-brand-600 hover:underline">View</Link>
                      )}
                    </td>
                  </tr>
                ))}
                {recentPublications.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500">
                      No publications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: string }) {
  return (
    <div className="glass-card p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
        <h4 className="text-3xl font-bold text-slate-900 dark:text-white">{value}</h4>
      </div>
      <div className="text-4xl opacity-80">{icon}</div>
    </div>
  );
}
