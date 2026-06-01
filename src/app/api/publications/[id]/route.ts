import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PublicationStatus } from '@prisma/client';

export async function GET(req: any, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publication = await prisma.publication.findUnique({
      where: { id: params.id },
      include: {
        faculty: { select: { name: true, employeeId: true } },
        department: { select: { name: true } },
        metadata: { orderBy: { createdAt: 'desc' } },
        validationResult: true
      }
    });

    if (!publication) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // RBAC
    if (session.user.role === 'FACULTY' && publication.facultyId !== session.user.facultyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ data: publication });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: any, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publication = await prisma.publication.findUnique({ where: { id: params.id } });
    if (!publication) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // RBAC
    if (session.user.role === 'FACULTY' && publication.facultyId !== session.user.facultyId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    
    // Prevent faculty from directly approving flagged publications without admin/hod
    if (body.status === PublicationStatus.APPROVED && session.user.role === 'FACULTY') {
      return NextResponse.json({ error: 'Faculty cannot force approve publications' }, { status: 403 });
    }

    const updated = await prisma.publication.update({
      where: { id: params.id },
      data: body
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_PUBLICATION',
        entityType: 'PUBLICATION',
        entityId: params.id,
        newData: body,
        userId: session.user.id
      }
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: any, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publication = await prisma.publication.findUnique({ where: { id: params.id } });
    if (!publication) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // RBAC: Only admins or the original owner (if pending/flagged) can delete
    const isOwner = session.user.role === 'FACULTY' && publication.facultyId === session.user.facultyId;
    const isPending = publication.status === PublicationStatus.PENDING || publication.status === PublicationStatus.FLAGGED;
    const isAdmin = session.user.role === 'INSTITUTION_ADMIN' || session.user.role === 'SUPER_ADMIN';

    if (!isAdmin && !(isOwner && isPending)) {
      return NextResponse.json({ error: 'Forbidden to delete approved publications' }, { status: 403 });
    }

    await prisma.publication.delete({ where: { id: params.id } });

    // Audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_PUBLICATION',
        entityType: 'PUBLICATION',
        entityId: params.id,
        oldData: publication as any,
        userId: session.user.id
      }
    });

    return NextResponse.json({ message: 'Deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
