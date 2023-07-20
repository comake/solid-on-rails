import type { Queue } from 'bull';
import type { QueueAdapter } from '../../../../src/jobs/adapter/QueueAdapter';
import type { Job } from '../../../../src/jobs/Job';
import { VoidQueueProcessor } from '../../../../src/jobs/processor/VoidQueueProcessor';

describe('A VoidQueueProcessor', (): void => {
  let queues: Record<string, Queue>;
  let perform: Job['perform'];
  let job: Job;
  let jobs: Job[];
  let processor: VoidQueueProcessor;
  let adapter: QueueAdapter;

  beforeEach(async(): Promise<void> => {
    queues = { default: { name: 'default' } as any };
    perform = jest.fn();
    job = { name: 'Void', perform, options: { queue: 'default' }};
    jobs = [ job ];

    adapter = { } as any;
    processor = new VoidQueueProcessor();
  });

  it('does nothing.', async(): Promise<void> => {
    expect(processor.processJobsOnQueues(queues, jobs, adapter)).toBeUndefined();
  });
});
