import { NextResponse } from 'next-auth/next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { addEnrichmentJob } from '@/lib/queue';
import { prisma } from '@/lib/prisma';
import { enrichmentService } from '@/services/enrichment.service';

export async function POST(req: any, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const publication = await prisma.publication.findUnique({ where: { id: params.id } });
    if (!publication) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json().catch(() => ({ async: true }));
    
    if (body.async) {
      // Add to BullMQ queue
      await addEnrichmentJob(params.id);
      return NextResponse.json({ message: 'Enrichment queued successfully' }, { status: 202 });
    } else {
      // Synchronous enrichment (useful for UI immediate feedback)
      const enriched = await enrichmentService.enrichPublication(params.id);
      return NextResponse.json({ data: enriched, message: 'Enrichment completed' });
    }
    
  } catch (error) {
    console.error('Enrichment endpoint error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
