import type { Queue } from 'bull';
import Bull from 'bull';
import { wait } from '../../util/TimerUtil';
import type { Job } from '../Job';
import type { JobOptions } from '../scheduler/JobScheduler';
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
}

/**
 * A BullQueueAdapter implements the {@link QueueAdapter} interface using the Bull
 * distributed job processing library.
 */
export class BullQueueAdapter implements QueueAdapter {
  public static readonly maxInitializationTimeout = 500;
  public static readonly initializationCheckPeriod = 50;
  private hasInitializedQueues = false;
  private isInitializingQueues = false;
  private readonly jobs: Record<string, Job>;
  private readonly queues: Record<string, Queue> = {};

  public constructor(args: BullQueueAdapterArgs) {
    this.jobs = args.jobs;
    for (const queue of args.queues) {
      this.queues[queue] = new Bull(queue, { redis: args.redisConfig });
    }
    this.ensureQueuesAreInitialized()
      .catch((): void => {
        // Do nothing?
      });
  }

  private async initializeQueues(): Promise<void> {
    this.isInitializingQueues = true;
    const bullQueues = Object.values(this.queues);
    // Register every job to be processable on every queue
    const processPromises = Object.keys(this.jobs).flatMap((jobName: string): Promise<void>[] =>
      bullQueues.map((queue): Promise<void> =>
        queue.process(jobName, async(bullJob): Promise<void> => {
          await this.jobs[jobName].perform(bullJob.data);
        })));
    await Promise.all(processPromises);
    this.hasInitializedQueues = true;
    this.isInitializingQueues = false;
  }

  public async performLater(
    jobName: string,
    data: Record<string, any> = {},
    options: JobOptions = {},
  ): Promise<void> {
    await this.ensureQueuesAreInitialized();
    const job = this.jobs[jobName];
    if (!job) {
      throw new Error(`Job '${jobName}' is not defined`);
    }

    const queueName = options?.queue ?? job.queue;
    const queue = this.queues[queueName];
    if (!queue) {
      throw new Error(`Queue '${queueName}' is not defined`);
    }

    const bullOptions = this.jobOptionsToBullOptions(options);
    await queue.add(jobName, data, bullOptions);
  }

  private async ensureQueuesAreInitialized(waitTime = 0): Promise<void> {
    if (!this.hasInitializedQueues && !this.isInitializingQueues) {
      await this.initializeQueues();
    } else if (!this.hasInitializedQueues && this.isInitializingQueues &&
      waitTime <= BullQueueAdapter.maxInitializationTimeout
    ) {
      await wait(BullQueueAdapter.initializationCheckPeriod);
      await this.ensureQueuesAreInitialized(waitTime + BullQueueAdapter.initializationCheckPeriod);
    } else if (!this.hasInitializedQueues) {
      throw new Error('Failed to initialize Bull queues.');
    }
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
}
