import type { QueueAdapter } from '../adapter/QueueAdapter';
import type { Job } from '../Job';

export interface QueueProcessor<TQueue> {
  processJobsOnQueues: (
    queues: Record<string, TQueue>,
    jobs: Record<string, Job>,
    queueAdapter: QueueAdapter,
  ) => void;
}
