import type { Queue } from 'bull';
import Bull from 'bull';
import { getLoggerFor } from '../../logging/LogUtil';
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
  protected readonly logger = getLoggerFor(this);
  private readonly jobs: Record<string, Job>;
  private readonly queues: Record<string, Queue> = {};

  public constructor(args: BullQueueAdapterArgs) {
    this.jobs = args.jobs;
    for (const queue of args.queues) {
      this.queues[queue] = new Bull(queue, { redis: args.redisConfig });
      // Register every job to be processable on every queue
      for (const jobName of Object.keys(this.jobs)) {
        this.queues[queue].process(jobName, async(bullJob): Promise<void> => {
          await this.jobs[jobName].perform(bullJob.data, this);
        }) as any;
      }
      this.initializeQueueEvents(this.queues[queue]);
    }
  }

  public async performLater(
    jobName: string,
    data: Record<string, any> = {},
    options: JobOptions = {},
  ): Promise<void> {
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

  private initializeQueueEvents(queue: Queue): void {
    queue.on('error', (error): void => {
      this.logger.info(`An error occured in queue ${queue.name}: ${error.message}\n${error.stack}`);
    });

    queue.on('active', (job): void => {
      this.logger.info(`Job ${job.name} has started on queue ${queue.name}`);
    });

    queue.on('stalled', (job): void => {
      this.logger.info(`Job ${job.name} has been marked as stalled on queue ${queue.name}`);
    });

    queue.on('completed', (job): void => {
      this.logger.info(`Job ${job.name} successfully completed on queue ${queue.name}`);
    });

    queue.on('failed', (job, error): void => {
      this.logger.info(`Job ${job.name} on queue ${queue.name} failed with reason: ${error.message}\n${error.stack}`);
    });
  }
}
