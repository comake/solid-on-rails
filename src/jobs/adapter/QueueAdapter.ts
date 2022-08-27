import type { Finalizable } from '../../init/finalize/Finalizable';
import type { JobOptions } from '../scheduler/JobScheduler';

/**
 * Adapts a {@link Job} to be queued and processed to a specific job scheduling library.
 */
export interface QueueAdapter extends Finalizable {
  performLater: (
    jobName: string,
    data?: Record<string, any>,
    options?: JobOptions,
  ) => Promise<void>;

  deleteQueue: (queueName: string) => Promise<void>;

  deleteAllQueues: () => Promise<void>;
}
