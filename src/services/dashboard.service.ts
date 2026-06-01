import { prisma } from '@/lib/prisma';
import { DashboardStats } from '@/types';
import { PublicationStatus } from '@prisma/client';

class DashboardService {

  async getDashboardStats(institutionId: string, departmentId?: string, facultyId?: string): Promise<DashboardStats> {
    
    // Base filter
    const baseWhere: any = { institutionId };
    if (departmentId) baseWhere.departmentId = departmentId;
    if (facultyId) baseWhere.facultyId = facultyId;

    const currentYear = new Date().getFullYear();

    // 1. Total & Pending Counts
    const [totalPublications, pendingValidation, thisYearPublications] = await Promise.all([
      prisma.publication.count({ where: baseWhere }),
      prisma.publication.count({ 
        where: { ...baseWhere, status: { in: [PublicationStatus.PENDING, PublicationStatus.ENRICHING, PublicationStatus.FLAGGED] } } 
      }),
      prisma.publication.count({ 
        where: { ...baseWhere, year: currentYear } 
      })
    ]);

    // 2. Aggregate metrics
    const typeAggr = await prisma.publication.groupBy({
      by: ['publicationType'],
      where: baseWhere,
      _count: true
    });
    
    const yearAggr = await prisma.publication.groupBy({
      by: ['year'],
      where: { ...baseWhere, year: { not: null } },
      _count: true,
      orderBy: { year: 'asc' }
    });

    const quartileAggr = await prisma.publication.groupBy({
      by: ['quartile'],
      where: baseWhere,
      _count: true
    });

    const citationsAggr = await prisma.publication.aggregate({
      where: baseWhere,
      _sum: { citationCount: true }
    });

    // 3. Top Faculty (Only if we aren't filtering by a specific faculty)
    let topFaculty: any[] = [];
    if (!facultyId) {
      const topFacultiesData = await prisma.publication.groupBy({
        by: ['facultyId'],
        where: { ...baseWhere, facultyId: { not: null } },
        _count: true,
        orderBy: { _count: { facultyId: 'desc' } },
        take: 5
      });
      
      // Fetch names
      const facultyIds = topFacultiesData.map(f => f.facultyId).filter(Boolean) as string[];
      if (facultyIds.length > 0) {
        const faculties = await prisma.faculty.findMany({
          where: { id: { in: facultyIds } },
          select: { id: true, name: true }
        });
        
        topFaculty = topFacultiesData.map(t => {
          const f = faculties.find(fac => fac.id === t.facultyId);
          return {
            id: t.facultyId!,
            name: f?.name || 'Unknown',
            count: t._count
          };
        });
      }
    }

    // 4. Recent Publications
    const recentPubs = await prisma.publication.findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, year: true, status: true, publicationType: true }
    });

    return {
      totalPublications,
      pendingValidation,
      thisYear: thisYearPublications,
      totalCitations: citationsAggr._sum.citationCount || 0,
      byType: typeAggr.map(t => ({ type: String(t.publicationType || 'Unknown'), count: t._count })),
      byYear: yearAggr.map(y => ({ year: y.year as number, count: y._count })),
      byQuartile: quartileAggr.map(q => ({ quartile: String(q.quartile), count: q._count })),
      topFaculty,
      recentPublications: recentPubs.map(p => ({
        id: p.id,
        title: p.title,
        year: p.year || 0,
        status: String(p.status),
        type: String(p.publicationType)
      }))
    };
  }

}

export const dashboardService = new DashboardService();
