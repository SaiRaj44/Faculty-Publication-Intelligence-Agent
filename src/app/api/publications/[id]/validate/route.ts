import { NextResponse } from 'next-auth/next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validationService } from '@/services/validation.service';

export async function POST(req: any, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publication = await prisma.publication.findUnique({ where: { id: params.id } });
    if (!publication) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Synchronous validation
    const report = await validationService.validatePublication(params.id);
    
    return NextResponse.json({ data: report, message: 'Validation completed' });
    
  } catch (error) {
    console.error('Validation endpoint error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
