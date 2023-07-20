import Bull from 'bull';
import type { BullQueueSettings } from '../../../../src/jobs/adapter/BullQueueAdapter';
import { BullQueueAdapter } from '../../../../src/jobs/adapter/BullQueueAdapter';
import type { Job } from '../../../../src/jobs/Job';
import type { BullQueueProcessor } from '../../../../src/jobs/processor/BullQueueProcessor';

jest.mock('bull');

Date.now = jest.fn((): number => 1659490735295);
const dayInMs = 1000 * 60 * 60 * 24;
const today = Date.now();
const tomorrow = new Date(today + dayInMs);

describe('A BullQueueAdapter', (): void => {
  const queue = 'default';
  let queues: Record<string, BullQueueSettings>;
  let perform: Job['perform'];
  let job: Job;
  let jobs: Job[];
  let close: any;
  let add: any;
  let obliterate: any;
  const redisConfig = { port: 6379, host: '127.0.0.1' };
  let adapter: BullQueueAdapter;
  let queueProcessor: BullQueueProcessor;

  beforeEach(async(): Promise<void> => {
    jest.clearAllMocks();

    queues = { default: {}};
    perform = jest.fn().mockImplementation(async(): Promise<void> => {
      // Do nothing
    });
    job = { name: 'example', perform, options: { queue }};
    jobs = [ job ];

    close = jest.fn();
    obliterate = jest.fn();
    add = jest.fn();
    queueProcessor = { processJobsOnQueues: jest.fn() } as any;

    (Bull as jest.Mock).mockImplementation(
      (name: string): Bull.Queue => ({ process, add, name, close, obliterate } as any),
    );
  });

  it('initializes bull queues.', async(): Promise<void> => {
    adapter = new BullQueueAdapter(jobs, queues, redisConfig, queueProcessor);
    await adapter.performLater('example');
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig, settings: {}});
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, {});
  });

  it('initializes queues with only one total concurrent job.', async(): Promise<void> => {
    jobs = [ job, { name: 'example2', perform, options: { queue }}];
    adapter = new BullQueueAdapter(jobs, queues, redisConfig, queueProcessor);
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig, settings: {}});
  });

  it('closes all queues when finalized.', async(): Promise<void> => {
    adapter = new BullQueueAdapter(jobs, queues, redisConfig, queueProcessor);
    await adapter.performLater('example');
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig, settings: {}});
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, {});
    await adapter.finalize();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('errors when attempting to perform a job which has not been defined.', async(): Promise<void> => {
    adapter = new BullQueueAdapter(jobs, queues, redisConfig, queueProcessor);
    await expect(adapter.performLater('sendEmail'))
      .rejects.toThrow('Job \'sendEmail\' is not defined');
  });

  it('errors when attempting to perform a job on a queue which has not been defined.', async(): Promise<void> => {
    adapter = new BullQueueAdapter(jobs, queues, redisConfig, queueProcessor);
    await expect(adapter.performLater('example', {}, { queue: 'critical' }))
      .rejects.toThrow('Queue \'critical\' is not defined');
  });

  it('adds the job to the queue if the job and queue are defined.', async(): Promise<void> => {
    adapter = new BullQueueAdapter(jobs, queues, redisConfig, queueProcessor);
    const data = { alpha: 1 };
    await expect(adapter.performLater('example', data))
      .resolves.toBeUndefined();
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig, settings: {}});
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', data, {});
  });

  it('adds the job on a cron schedule.', async(): Promise<void> => {
    adapter = new BullQueueAdapter(jobs, queues, redisConfig, queueProcessor);
    await expect(adapter.performLater('example', {}, { every: '5 4 * * *' }))
      .resolves.toBeUndefined();
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig, settings: {}});
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { repeat: { cron: '5 4 * * *' }});
  });

  it('adds the job on a cron schedule with a start time at a specific date.', async(): Promise<void> => {
    adapter = new BullQueueAdapter(jobs, queues, redisConfig, queueProcessor);
    await expect(adapter.performLater('example', {}, { at: tomorrow, every: '5 4 * * *' }))
      .resolves.toBeUndefined();
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig, settings: {}});
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { repeat: { cron: '5 4 * * *', startDate: dayInMs }});
  });

  it('adds the job on a cron schedule with a start time after a delay.', async(): Promise<void> => {
    adapter = new BullQueueAdapter(jobs, queues, redisConfig, queueProcessor);
    await expect(adapter.performLater('example', {}, { in: 1000, every: '5 4 * * *' }))
      .resolves.toBeUndefined();
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig, settings: {}});
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { repeat: { cron: '5 4 * * *', startDate: 1000 }});
  });

  it('adds the job on a certain millisecond schedule.', async(): Promise<void> => {
    adapter = new BullQueueAdapter(jobs, queues, redisConfig, queueProcessor);
    await expect(adapter.performLater('example', {}, { every: 1000 }))
      .resolves.toBeUndefined();
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig, settings: {}});
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { repeat: { every: 1000 }});
  });

  it('adds the job to be run at a specific date.', async(): Promise<void> => {
    adapter = new BullQueueAdapter(jobs, queues, redisConfig, queueProcessor);
    await expect(adapter.performLater('example', {}, { at: tomorrow }))
      .resolves.toBeUndefined();
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig, settings: {}});
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { delay: dayInMs });
  });

  it('adds the job to be run after a delay.', async(): Promise<void> => {
    adapter = new BullQueueAdapter(jobs, queues, redisConfig, queueProcessor);
    await expect(adapter.performLater('example', {}, { in: 1000 }))
      .resolves.toBeUndefined();
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig, settings: {}});
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { delay: 1000 });
  });

  it('adds the job with an auto-retry backoff setting.', async(): Promise<void> => {
    adapter = new BullQueueAdapter(jobs, queues, redisConfig, queueProcessor);
    await expect(adapter.performLater('example', {}, { retryAttempts: 3 }))
      .resolves.toBeUndefined();
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig, settings: {}});
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
    });
  });

  it('deletes a queue.', async(): Promise<void> => {
    adapter = new BullQueueAdapter(jobs, queues, redisConfig, queueProcessor);
    await expect(adapter.deleteQueue('default')).resolves.toBeUndefined();
    expect(obliterate).toHaveBeenCalledTimes(1);
    expect(obliterate).toHaveBeenCalledWith({ force: true });
  });

  it('throws an error when deleting a queue that does not exist.', async(): Promise<void> => {
    adapter = new BullQueueAdapter(jobs, queues, redisConfig, queueProcessor);
    await expect(adapter.deleteQueue('otherQueue')).rejects.toThrow('No queue named otherQueue found');
    expect(obliterate).toHaveBeenCalledTimes(0);
  });

  it('deletes all queues.', async(): Promise<void> => {
    queues = { queue: {}, secondQueue: {}};
    adapter = new BullQueueAdapter(jobs, queues, redisConfig, queueProcessor);
    await expect(adapter.deleteAllQueues()).resolves.toBeUndefined();
    expect(obliterate).toHaveBeenCalledTimes(2);
    expect(obliterate).toHaveBeenCalledWith({ force: true });
  });

  it('sets up jobs to be processed on the queueProcessor.', async(): Promise<void> => {
    adapter = new BullQueueAdapter(jobs, queues, redisConfig, queueProcessor);
    expect(queueProcessor.processJobsOnQueues).toHaveBeenCalledTimes(1);
    expect(queueProcessor.processJobsOnQueues).toHaveBeenCalledWith(
      expect.objectContaining({
        default: expect.any(Object),
      }),
      [ job ],
      adapter,
    );
  });
});
