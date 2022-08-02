/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Queue } from 'bull';
import Bull from 'bull';
import type { Job } from '../Job';
import type { JobOptions } from '../scheduler/JobScheduler';
import type { QueueAdapter } from './QueueAdapter';

export class BullQueueAdapter implements QueueAdapter {
  private readonly jobs: Record<string, Job>;
  private readonly queues: Record<string, Queue> = {};

  public constructor(jobs: Record<string, Job>, queues: string[]) {
    this.jobs = jobs;
    queues.forEach((queueName: string): void => {
      this.queues[queueName] = new Bull(queueName);
    });
  }

  public async performLater(
    jobName: string,
    data?: Record<string, any>,
    options?: JobOptions,
  ): Promise<void> {
    // Get job
    // Run job on default queue or override queue from options

  }
}
