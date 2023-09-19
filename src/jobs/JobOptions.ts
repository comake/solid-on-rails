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
   * How many times this job will be auto-retried on failure.
   * If this field is not specified, the job will not be auto-retried.
   */
  retryAttempts?: number;
  /**
   * Whether jobs of this type should be removed from storage after they are completed
   */
  disableRemoveOnComplete?: boolean;
  /**
   * The number of seconds after which to remove failed jobs
   */
  removeOnFailAge?: number;
  /**
   * The number of failed jobs to keep
   */
  removeOnFailCount?: number;
}

export type ConfiguredJobOptions = Omit<JobOptions, 'at'>;
