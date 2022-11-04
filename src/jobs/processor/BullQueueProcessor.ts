import type { Queue } from 'bull';
import { getLoggerFor } from '../../logging/LogUtil';
import type { QueueAdapter } from '../adapter/QueueAdapter';
import type { Job } from '../Job';
import type { QueueProcessor } from './QueueProcessor';

export class BullQueueProcessor implements QueueProcessor<Queue> {
  protected readonly logger = getLoggerFor(this);

  public processJobsOnQueues(
    queues: Record<string, Queue>,
    jobs: Record<string, Job>,
    queueAdapter: QueueAdapter,
  ): void {
    for (const queue of Object.keys(queues)) {
      let isFirst = true;
      for (const jobName of Object.keys(jobs)) {
        queues[queue].process(jobName, isFirst ? 1 : 0, async(bullJob): Promise<void> =>
          jobs[jobName].perform(bullJob.data, queueAdapter)) as any;
        isFirst = false;
      }
      this.initializeQueueEvents(queues[queue]);
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
