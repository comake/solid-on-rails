import type { QueueAdapter } from '../adapter/QueueAdapter';
import type { JobOptions } from '../JobOptions';
import type { JobScheduler } from './JobScheduler';

export class AdapterBasedScheduler implements JobScheduler {
  private readonly adapter: QueueAdapter;

  public constructor(adapter: QueueAdapter) {
    this.adapter = adapter;
  }

  public async performLater(
    jobName: string,
    data?: Record<string, any>,
    overrideOptions?: Partial<JobOptions>,
  ): Promise<void> {
    await this.adapter.performLater(jobName, data, overrideOptions);
  }
}
