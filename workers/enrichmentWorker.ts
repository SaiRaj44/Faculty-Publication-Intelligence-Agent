import { Worker, Job } from 'bullmq';
import { prisma } from '../src/lib/prisma';
import { enrichPublicationData } from '../src/agents/enrichmentAgent';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

console.log('Starting Publication Enrichment Worker...');
console.log(`Connecting to Redis at ${REDIS_URL}`);

export const enrichmentWorker = new Worker(
  'publication-enrichment',
  async (job: Job) => {
    console.log(`[Worker] Processing job ${job.id} for publication ${job.data.publicationId}`);
    
    const { publicationId, rawInput } = job.data;
    
    try {
      // 1. Fetch the publication to ensure it exists
      const pub = await prisma.publication.findUnique({
        where: { id: publicationId }
      });

      if (!pub) {
        throw new Error(`Publication ${publicationId} not found in database.`);
      }

      // 2. Call the Gemini AI Agent to extract structured metadata
      console.log(`[Worker] Asking Gemini to enrich metadata for ${publicationId}...`);
      const enrichedMetadata = await enrichPublicationData(rawInput);
      
      // 3. Update the publication with the enriched data
      await prisma.publication.update({
        where: { id: publicationId },
        data: {
          title: enrichedMetadata.title || pub.title,
          year: enrichedMetadata.year || pub.year,
          journalName: enrichedMetadata.journalName || pub.journalName,
          publisher: enrichedMetadata.publisher || pub.publisher,
          abstract: enrichedMetadata.abstract || pub.abstract,
          doi: enrichedMetadata.doi || pub.doi,
          enrichedAt: new Date(),
        }
      });

      console.log(`[Worker] Successfully enriched publication ${publicationId}!`);
      return { success: true, enrichedFields: Object.keys(enrichedMetadata) };

    } catch (error) {
      console.error(`[Worker] Failed to process job ${job.id}:`, error);
      
      // Update publication to reflect enrichment failure
      await prisma.publication.update({
        where: { id: publicationId },
        data: {
          enrichedAt: new Date(), // Mark as attempted
        }
      });

      throw error;
    }
  },
  {
    connection: {
      url: REDIS_URL
    },
    concurrency: 5 // Process up to 5 publications concurrently
  }
);

enrichmentWorker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed!`);
});

enrichmentWorker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} has failed with ${err.message}`);
});
