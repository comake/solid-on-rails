/* eslint-disable @typescript-eslint/no-unused-vars */
import { getLoggerFor } from '../../logging/LogUtil';
import type { QueueAdapter } from '../adapter/QueueAdapter';
import type { Job } from '../Job';
import type { QueueProcessor } from './QueueProcessor';

export class VoidQueueProcessor implements QueueProcessor<any> {
  protected readonly logger = getLoggerFor(this);

  public processJobsOnQueues(
    queues: Record<string, any>,
    jobs: Job[],
    queueAdapter: QueueAdapter,
  ): void {
    // Do nothing
  }
}
