/* eslint-disable tsdoc/syntax */
import type { Queue, Job as BullJob } from 'bull';
import Bull from 'bull';
import { getLoggerFor } from '../../logging/LogUtil';
import type { Job } from '../Job';
import type { JobInfo } from '../JobInfo';
import type { JobOptions } from '../JobOptions';
import type { BullQueueProcessor } from '../processor/BullQueueProcessor';
import type { QueueAdapter } from './QueueAdapter';

export interface RedisConfig {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  dbNumber?: string;
}

export interface BullQueueSettings {
  /**
   * Key expiration time for job locks.
   */
  lockDuration?: number;
  /**
   * Interval on which to acquire the job lock
   */
  lockRenewTime?: number;
  /**
   * How often check for stalled jobs (use 0 for never checking).
   */
  stalledInterval?: number;
  /**
   * Max amount of times a stalled job will be re-processed.
   */
  maxStalledCount?: number;
  /**
   * Poll interval for delayed jobs and added jobs.
   */
  guardInterval?: number;
  /**
   * Delay before processing next job in case of internal error.
   */
  retryProcessDelay?: number;
  /**
   * A set of custom backoff strategies keyed by name.
   */
  backoffStrategies?: Record<string, any>;
  /**
   * A timeout for when the queue is in drained state (empty waiting for jobs).
   */
  drainDelay?: number;
  /**
   * Enables multiple queues on the same instance of child pool to share the same instance.
   */
  isSharedChildPool?: boolean;
}

const DEFAULT_BACKOFF_DELAY = 2000;

/**
 * A BullQueueAdapter implements the {@link QueueAdapter} interface using the Bull
 * distributed job processing library.
 */
export class BullQueueAdapter implements QueueAdapter {
  protected readonly logger = getLoggerFor(this);
  private readonly jobs: Job[];
  private readonly queues: Record<string, Queue> = {};

  /**
   * @param jobs - The jobs which can be run.
   * @param queues - The queues which jobs can be run on. @range {json}
   * @param redisConfig - The configuration for redis to store job and queue details.
   * @param queueProcessor - The queue processor.
   */
  public constructor(
    jobs: Job[],
    queues: Record<string, BullQueueSettings>,
    redisConfig: RedisConfig,
    queueProcessor: BullQueueProcessor,
  ) {
    this.jobs = jobs;

    for (const [ queue, settings ] of Object.entries(queues)) {
      this.queues[queue] = new Bull(
        queue,
        {
          redis: redisConfig,
          settings,
        },
      );
    }
    queueProcessor.processJobsOnQueues(this.queues, this.jobs, this);
  }

  public async finalize(): Promise<void> {
    await Promise.all(
      Object.values(this.queues)
        .map((queue: Queue): Promise<void> => queue.close()),
    );
  }

  public async performLater(
    jobName: string,
    data: Record<string, any> = {},
    overrideOptions: Partial<JobOptions> = {},
  ): Promise<JobInfo> {
    const job = this.jobs.find((jobIter): boolean => jobIter.name === jobName);
    if (!job) {
      throw new Error(`Job '${jobName}' is not defined`);
    }

    const options = { ...job.options, ...overrideOptions };
    const queueName = options.queue;
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue '${queueName}' is not defined`);
    }

    const bullOptions = this.jobOptionsToBullOptions(options);
    const queuedJob = await queue.add(jobName, data, bullOptions);
    return this.bullJobToJobInfo(queuedJob);
  }

  private bullJobToJobInfo(queuedJob: BullJob): JobInfo {
    return {
      id: queuedJob.id as string,
      queue: queuedJob.queue.name,
    };
  }

  private jobOptionsToBullOptions(options: JobOptions): Bull.JobOptions {
    const bullOptions: Bull.JobOptions = {};

    bullOptions.removeOnComplete = !options.disableRemoveOnComplete;

    if (options.removeOnFailAge ?? options.removeOnFailCount) {
      bullOptions.removeOnFail = {
        age: options.removeOnFailAge,
        count: options.removeOnFailCount,
      };
    }

    if (options.every && typeof options.every === 'string') {
      bullOptions.repeat = { cron: options.every };
      this.addDelayFieldToObject(bullOptions.repeat, 'startDate', options.at ?? options.in);
    } else if (options.every && typeof options.every === 'number') {
      bullOptions.repeat = { every: options.every };
    } else {
      this.addDelayFieldToObject(bullOptions, 'delay', options.at ?? options.in);
    }

    if (options.retryAttempts !== undefined) {
      bullOptions.attempts = options.retryAttempts;
      bullOptions.backoff = {
        type: 'exponential',
        delay: DEFAULT_BACKOFF_DELAY,
      };
    }

    return bullOptions;
  }

  private addDelayFieldToObject(
    object: Record<string, any>,
    fieldName: string,
    delayValue?: Date | number,
  ): void {
    if (delayValue && delayValue instanceof Date) {
      const currentTime = Date.now();
      const delay = delayValue.getTime() - currentTime;
      if (delay > 0) {
        object[fieldName] = delay;
      }
    } else if (delayValue && typeof delayValue === 'number') {
      object[fieldName] = delayValue;
    }
  }

  public async removeJob(jobId: string, queueName: string): Promise<void> {
    const queue = this.queues[queueName];
    const job = await queue.getJob(jobId);
    if (job) {
      await job.remove();
    }
  }

  public async deleteQueue(queueName: string): Promise<void> {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`No queue named ${queueName} found`);
    }

    await queue.obliterate({ force: true });
  }

  public async deleteAllQueues(): Promise<void> {
    await Promise.allSettled(
      Object.keys(this.queues)
        .map((queueName: string): Promise<void> => this.deleteQueue(queueName)),
    );
  }

  public async removeCompletedInQueue(queueName: string): Promise<void> {
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`No queue named ${queueName} found`);
    }
    const getCompletedFn = queue.getCompleted as (start?: number, end?: number, opts?: any) => Promise<BullJob[]>;
    const completed = await getCompletedFn(undefined, undefined, { excludeData: true });
    await Promise.all(
      completed.map((job): Promise<void> => job.remove()),
    );
  }
}
