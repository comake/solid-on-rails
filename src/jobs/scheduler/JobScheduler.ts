import type { JobOptions } from '../JobOptions';

export interface JobScheduler {
  /**
 * Queues a {@link Job} to be performed by a Worker.
 * @param jobName - The name of the job to perform.
 * @param data - The data to pass as arguments to the Job.
 * @returns A Job.
 */
  performLater: (
    jobName: string,
    data?: Record<string, any>,
    overrideOptions?: Partial<JobOptions>,
  ) => Promise<void>;
}
