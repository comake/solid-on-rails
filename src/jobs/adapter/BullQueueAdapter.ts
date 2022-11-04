import type { Queue } from 'bull';
import Bull from 'bull';
import { getLoggerFor } from '../../logging/LogUtil';
import type { Job } from '../Job';
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

export interface BullQueueAdapterArgs {
  jobs: Record<string, Job>;
  queues: string[];
  redisConfig: RedisConfig;
  queueProcessor: BullQueueProcessor;
}

const DEFAULT_BACKOFF_DELAY = 2000;

/**
 * A BullQueueAdapter implements the {@link QueueAdapter} interface using the Bull
 * distributed job processing library.
 */
export class BullQueueAdapter implements QueueAdapter {
  protected readonly logger = getLoggerFor(this);
  private readonly jobs: Record<string, Job>;
  private readonly queues: Record<string, Queue> = {};

  public constructor(args: BullQueueAdapterArgs) {
    this.jobs = args.jobs;

    for (const queue of args.queues) {
      this.queues[queue] = new Bull(queue, { redis: args.redisConfig });
    }
    args.queueProcessor.processJobsOnQueues(this.queues, this.jobs, this);
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
  ): Promise<void> {
    const job = this.jobs[jobName];
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
    await queue.add(jobName, data, bullOptions);
  }

  private jobOptionsToBullOptions(options: JobOptions): Bull.JobOptions {
    const bullOptions: Bull.JobOptions = {};

    if (options.every && typeof options.every === 'string') {
      bullOptions.repeat = { cron: options.every };
      this.addDelayFieldToObject(bullOptions.repeat, 'startDate', options.at ?? options.in);
    } else if (options.every && typeof options.every === 'number') {
      bullOptions.repeat = { every: options.every };
    } else {
      this.addDelayFieldToObject(bullOptions, 'delay', options.at ?? options.in);
    }

    if (options.retry) {
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
}
