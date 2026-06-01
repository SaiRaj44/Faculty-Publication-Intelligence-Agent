import { Queue, QueueOptions } from 'bullmq';
import { ReportConfig } from '@/types';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

const connectionConfig = {
  url: redisUrl,
};

const defaultQueueOptions: QueueOptions = {
  connection: connectionConfig,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
};

// Queue Names
export const QUEUE_ENRICHMENT = 'publication-enrichment';
export const QUEUE_BATCH = 'batch-processing';
export const QUEUE_REPORT = 'report-generation';

// Queue Instances
export const enrichmentQueue = new Queue(QUEUE_ENRICHMENT, defaultQueueOptions);
export const batchQueue = new Queue(QUEUE_BATCH, defaultQueueOptions);
export const reportQueue = new Queue(QUEUE_REPORT, defaultQueueOptions);

// Helpers
export const addEnrichmentJob = async (publicationId: string) => {
  return enrichmentQueue.add('enrich', { publicationId });
};

export const addBatchJob = async (jobId: string, fileUrl: string) => {
  return batchQueue.add('process-batch', { batchJobId: jobId, fileUrl });
};

export const addReportJob = async (reportId: string, config: ReportConfig) => {
  return reportQueue.add('generate-report', { reportId, config });
};

export { connectionConfig };
