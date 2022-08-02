export type Cron = string;

export interface JobOptions {
  /**
   * A date in the future after which the job can be processed.
   */
  at?: Date;
  /**
   * An amount of milliseconds to wait until the job can be processed.
   */
  in?: number;
  /**
   * The interval at which the job should be repeatedly processed.
   * Can either be specified as a Cron string or a number in milliseconds.
   */
  every?: Cron | number;
}

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
    options?: JobOptions,
  ) => Promise<void>;
}
