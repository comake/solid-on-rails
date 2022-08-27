/* eslint-disable tsdoc/syntax */
import type { QueueAdapter } from './adapter/QueueAdapter';
import type { ConfiguredJobOptions } from './JobOptions';
/**
 * A single asyncronous Job.
 */
export abstract class Job {
  public readonly options: ConfiguredJobOptions = { queue: 'default' };

  /**
   * @param options - The options this job will be performed with. @range {json}
   */
  public constructor(options?: ConfiguredJobOptions) {
    if (options) {
      this.options = options;
    }
  }

  /**
   * The function that will be executed when this job is run by a worker.
   * @param data - the data which can be used by the job.
   * @param queueAdapter - the application's queue adapter so that jobs can queue other jobs.
   */
  public abstract perform(data: Record<string, any>, queueAdapter: QueueAdapter): Promise<void>;
}
