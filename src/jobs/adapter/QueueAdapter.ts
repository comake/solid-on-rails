import type { JobOptions } from '../scheduler/JobScheduler';

/**
 * Adapts a {@link Job} to be queued and processed to a specific job scheduling library.
 */
export interface QueueAdapter {
  performLater: (
    jobName: string,
    data?: Record<string, any>,
    options?: JobOptions,
  ) => Promise<void>;
}
