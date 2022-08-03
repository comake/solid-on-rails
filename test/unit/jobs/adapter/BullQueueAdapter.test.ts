import Bull from 'bull';
import { BullQueueAdapter } from '../../../../src/jobs/adapter/BullQueueAdapter';
import type { Job } from '../../../../src/jobs/Job';
import { advanceTimersByTimeAndFlushPromises, executeSequentially } from '../../../util/Util';

jest.mock('bull');

Date.now = jest.fn((): number => 1659490735295);
const dayInMs = 1000 * 60 * 60 * 24;
const today = Date.now();
const tomorrow = new Date(today + dayInMs);

describe('A BullQueueAdapter', (): void => {
  const queue = 'default';
  let queues: string[];
  let perform: Job['perform'];
  let job: Job;
  let jobs: Record<string, Job>;
  let process: any;
  let add: any;
  let bullConstructor: any;
  const redisConfig = { port: 6379, host: '127.0.0.1' };
  let adapter: BullQueueAdapter;
  let registeredJobs: Record<string, (data: any) => Promise<void>>;

  beforeEach(async(): Promise<void> => {
    queues = [ queue ];
    registeredJobs = {};
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    perform = jest.fn().mockImplementation(async(data): Promise<void> => {
      // Do nothing
    });
    job = { perform, queue };
    jobs = { example: job };

    process = jest.fn().mockImplementation(
      async(jobName: string, processFn: (bullJob: any) => Promise<void>): Promise<void> => {
        registeredJobs[jobName] = processFn;
      },
    );

    add = jest.fn().mockImplementation(
      async(jobName: string, data: any, options: any): Promise<void> => {
        if (!options.repeat && !options.delay) {
          await registeredJobs[jobName]({ data });
        }
      },
    );
    bullConstructor = jest.fn().mockImplementation((): Bull.Queue => ({ process, add } as any));
    (Bull as jest.Mock).mockImplementation(bullConstructor);
  });

  it('initializes bull queues.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await adapter.performLater('example');
    expect(bullConstructor).toHaveBeenCalledTimes(1);
    expect(bullConstructor).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
  });

  it('errors when attempting to perform a job which has not been defined.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await expect(adapter.performLater('sendEmail'))
      .rejects.toThrow('Job \'sendEmail\' is not defined');
  });

  it('errors when attempting to perform a job on a queue which has not been defined.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await expect(adapter.performLater('example', {}, { queue: 'critical' }))
      .rejects.toThrow('Queue \'critical\' is not defined');
  });

  it('errors when queues are not initialized within the max initialization timeout.', async(): Promise<void> => {
    jest.useFakeTimers();
    // Make the queue process function take a long time
    process.mockImplementation(
      async(): Promise<void> => new Promise((resolve): void => {
        setTimeout(resolve, 1000);
      }),
    );

    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    const promise = adapter.performLater('example');
    const retries = (BullQueueAdapter.maxInitializationTimeout / BullQueueAdapter.initializationCheckPeriod) + 1;
    await executeSequentially(
      [ ...Array.from({ length: retries }).keys() ]
        .map((index): () => Promise<void> =>
          advanceTimersByTimeAndFlushPromises.bind(
            this,
            index !== retries - 1,
            BullQueueAdapter.initializationCheckPeriod,
          )),
    );

    await expect(promise).rejects.toThrow('Failed to initialize Bull queues.');
    jest.runAllTimers();
    jest.useRealTimers();
  });

  it('adds the job to the queue if the job and queue are defined.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    const data = { alpha: 1 };
    await expect(adapter.performLater('example', data))
      .resolves.toBeUndefined();
    expect(bullConstructor).toHaveBeenCalledTimes(1);
    expect(bullConstructor).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', data, {});
    expect(perform).toHaveReturnedTimes(1);
    expect(perform).toHaveBeenCalledWith(data);
  });

  it('adds the job on a cron schedule.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await expect(adapter.performLater('example', {}, { every: '5 4 * * *' }))
      .resolves.toBeUndefined();
    expect(bullConstructor).toHaveBeenCalledTimes(1);
    expect(bullConstructor).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { repeat: { cron: '5 4 * * *' }});
    expect(perform).toHaveReturnedTimes(0);
  });

  it('adds the job on a cron schedule with a start time at a specific date.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await expect(adapter.performLater('example', {}, { at: tomorrow, every: '5 4 * * *' }))
      .resolves.toBeUndefined();
    expect(bullConstructor).toHaveBeenCalledTimes(1);
    expect(bullConstructor).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { repeat: { cron: '5 4 * * *', startDate: dayInMs }});
    expect(perform).toHaveReturnedTimes(0);
  });

  it('adds the job on a cron schedule with a start time after a delay.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await expect(adapter.performLater('example', {}, { in: 1000, every: '5 4 * * *' }))
      .resolves.toBeUndefined();
    expect(bullConstructor).toHaveBeenCalledTimes(1);
    expect(bullConstructor).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { repeat: { cron: '5 4 * * *', startDate: 1000 }});
    expect(perform).toHaveReturnedTimes(0);
  });

  it('adds the job on a certain millisecond schedule.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await expect(adapter.performLater('example', {}, { every: 1000 }))
      .resolves.toBeUndefined();
    expect(bullConstructor).toHaveBeenCalledTimes(1);
    expect(bullConstructor).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { repeat: { every: 1000 }});
    expect(perform).toHaveReturnedTimes(0);
  });

  it('adds the job to be run at a specific date.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await expect(adapter.performLater('example', {}, { at: tomorrow }))
      .resolves.toBeUndefined();
    expect(bullConstructor).toHaveBeenCalledTimes(1);
    expect(bullConstructor).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { delay: dayInMs });
    expect(perform).toHaveReturnedTimes(0);
  });

  it('adds the job to be run after a delay.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await expect(adapter.performLater('example', {}, { in: 1000 }))
      .resolves.toBeUndefined();
    expect(bullConstructor).toHaveBeenCalledTimes(1);
    expect(bullConstructor).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { delay: 1000 });
    expect(perform).toHaveReturnedTimes(0);
  });
});
