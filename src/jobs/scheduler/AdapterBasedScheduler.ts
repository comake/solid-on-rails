import type { QueueAdapter } from '../adapter/QueueAdapter';
import type { JobScheduler, JobOptions } from './JobScheduler';

export class AdapterBasedScheduler implements JobScheduler {
  private readonly adapter: QueueAdapter;

  public constructor(adapter: QueueAdapter) {
    this.adapter = adapter;
  }

  public async performLater(
    jobName: string,
    data?: Record<string, any>,
    options?: JobOptions,
  ): Promise<void> {
    await this.adapter.performLater(jobName, data, options);
  }
}
