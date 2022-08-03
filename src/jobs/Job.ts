/**
 * A single asyncronous Job.
 */
export abstract class Job {
  /**
   * The default queue that this job will be performed on.
   */
  public readonly queue: string;

  public constructor(queue: string) {
    this.queue = queue;
  }

  /**
   * The function that will be executed when this job is run by a worker.
   * @param data - the data which can be used by the job.
   */
  public abstract perform(data: Record<string, any>): Promise<void>;
}
