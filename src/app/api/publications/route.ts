import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PublicationStatus } from '@prisma/client';
import { addEnrichmentJob } from '@/lib/queue';

export async function GET(req: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') as PublicationStatus;
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined;
    
    // RBAC Filter
    const where: any = { institutionId: session.user.institutionId };
    
    // Faculty can only see their own publications or their department's if they are HOD
    if (session.user.role === 'FACULTY' && session.user.facultyId) {
      where.facultyId = session.user.facultyId;
    } else if (session.user.role === 'HOD') {
      const faculty = await prisma.faculty.findUnique({ where: { id: session.user.facultyId! } });
      if (faculty) {
        where.departmentId = faculty.departmentId;
      }
    }

    if (status) where.status = status;
    if (year) where.year = year;

    const skip = (page - 1) * limit;

    const [publications, total] = await Promise.all([
      prisma.publication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { faculty: { select: { name: true } }, department: { select: { name: true } } }
      }),
      prisma.publication.count({ where })
    ]);

    return NextResponse.json({
      data: publications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Failed to fetch publications:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: any) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    
    let facultyId = body.facultyId;
    
    // If the frontend sent 'temp' or missing, and the user has a faculty profile (FACULTY or HOD), use theirs.
    if (!facultyId || facultyId === 'temp') {
      facultyId = session.user.facultyId;
    }

    // Force FACULTY role to only submit for themselves
    if (session.user.role === 'FACULTY') {
      facultyId = session.user.facultyId;
    }

    if (!facultyId) {
      return NextResponse.json({ error: 'facultyId is required' }, { status: 400 });
    }

    const faculty = await prisma.faculty.findUnique({ where: { id: facultyId } });
    if (!faculty) {
      return NextResponse.json({ error: 'Faculty not found' }, { status: 404 });
    }

    const publication = await prisma.publication.create({
      data: {
        title: body.title,
        doi: body.doi,
        url: body.url,
        abstract: body.abstract,
        year: body.year,
        authors: body.authors || [],
        journalName: body.journalName,
        conferenceName: body.conferenceName,
        publisher: body.publisher,
        publicationType: body.publicationType,
        facultyId: faculty.id,
        departmentId: faculty.departmentId,
        institutionId: session.user.institutionId!,
        submittedById: session.user.id,
        status: PublicationStatus.PENDING
      }
    });

    // Auto-trigger enrichment
    await addEnrichmentJob(publication.id);

    return NextResponse.json({ data: publication, message: 'Publication created and queued for enrichment' }, { status: 201 });
  } catch (error) {
    console.error('Failed to create publication:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
