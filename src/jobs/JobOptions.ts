export type Cron = string;

export interface JobOptions {
  /**
   * The name of a queue to run the job on instead of the job's default queue.
   */
  queue: string;
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
  /**
   * Whether this job should be auto-retried on failure or not.
   */
  retry?: boolean;
}

export type ConfiguredJobOptions = Omit<JobOptions, 'at'>;
