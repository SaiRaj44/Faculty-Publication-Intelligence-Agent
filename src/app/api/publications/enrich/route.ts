import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data } = await req.json();
    const { doi } = data;

    if (!doi) {
      return NextResponse.json({ error: 'DOI is required' }, { status: 400 });
    }

    // Mock API call to Crossref/Scopus
    // In a real implementation, we would call an external API here using the DOI.
    
    // Simulating a delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const enrichedData = {
      doi,
      title: `Sample Enriched Publication for DOI: ${doi}`,
      abstract: 'This is an automatically generated abstract fetched from Crossref based on the provided DOI. It demonstrates the capabilities of the smart AI enrichment feature.',
      authors: ['John Doe', 'Jane Smith', 'Alice Johnson'],
      venue: 'IEEE Transactions on Neural Networks and Learning Systems',
      year: new Date().getFullYear(),
      citationCount: 42,
      publisher: 'IEEE',
      type: 'JOURNAL',
      source: 'Crossref',
    };

    return NextResponse.json(enrichedData);
  } catch (error: any) {
    console.error('Enrichment error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
