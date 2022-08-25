import Bull from 'bull';
import { BullQueueAdapter } from '../../../../src/jobs/adapter/BullQueueAdapter';
import type { Job } from '../../../../src/jobs/Job';
import type { Logger } from '../../../../src/logging/Logger';
import { getLoggerFor } from '../../../../src/logging/LogUtil';

jest.mock('bull');

jest.mock('../../../../src/logging/LogUtil', (): any => {
  const logger: Logger = { info: jest.fn() } as any;
  return { getLoggerFor: (): Logger => logger };
});
const logger: jest.Mocked<Logger> = getLoggerFor('StreamUtil') as any;

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
  let close: any;
  let add: any;
  let on: any;
  const redisConfig = { port: 6379, host: '127.0.0.1' };
  let adapter: BullQueueAdapter;
  let registeredJobs: Record<string, (data: any) => Promise<void>>;
  let registeredEvents: Record<string, (...args: any[]) => void>;
  let error: Error | undefined;
  let stalled: boolean;

  beforeEach(async(): Promise<void> => {
    jest.clearAllMocks();

    queues = [ queue ];
    registeredJobs = {};
    perform = jest.fn().mockImplementation(async(): Promise<void> => {
      // Do nothing
    });
    job = { perform, queue };
    jobs = { example: job };

    close = jest.fn();
    process = jest.fn().mockImplementation(
      (jobName: string, processFn: (bullJob: any) => Promise<void>): void => {
        registeredJobs[jobName] = processFn;
      },
    );

    error = undefined;
    stalled = false;
    add = jest.fn().mockImplementation(
      async(jobName: string, data: any, options: any): Promise<void> => {
        if (!options.repeat && !options.delay) {
          const jobDetails = { name: jobName };
          registeredEvents.active(jobDetails);
          if (error) {
            registeredEvents.failed(jobDetails, error);
            registeredEvents.error(error);
          } else {
            if (stalled) {
              registeredEvents.stalled(jobDetails);
            }
            await registeredJobs[jobName]({ data });
            registeredEvents.completed(jobDetails);
          }
        }
      },
    );

    registeredEvents = {};
    on = jest.fn().mockImplementation((event: string, handler: () => void): void => {
      registeredEvents[event] = handler;
    });

    (Bull as jest.Mock).mockImplementation(
      (name: string): Bull.Queue => ({ process, add, on, name, close } as any),
    );
  });

  it('initializes bull queues.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await adapter.performLater('example');
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, {});
    expect(on).toHaveBeenCalledTimes(5);
  });

  it('closes all queues when finalized.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await adapter.performLater('example');
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, {});
    expect(on).toHaveBeenCalledTimes(5);
    await adapter.finalize();
    expect(close).toHaveBeenCalledTimes(1);
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

  it('adds the job to the queue if the job and queue are defined.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    const data = { alpha: 1 };
    await expect(adapter.performLater('example', data))
      .resolves.toBeUndefined();
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', data, {});
    expect(perform).toHaveBeenCalledTimes(1);
    expect(perform).toHaveBeenCalledWith(data, adapter);
  });

  it('adds the job on a cron schedule.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await expect(adapter.performLater('example', {}, { every: '5 4 * * *' }))
      .resolves.toBeUndefined();
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { repeat: { cron: '5 4 * * *' }});
    expect(perform).toHaveBeenCalledTimes(0);
  });

  it('adds the job on a cron schedule with a start time at a specific date.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await expect(adapter.performLater('example', {}, { at: tomorrow, every: '5 4 * * *' }))
      .resolves.toBeUndefined();
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { repeat: { cron: '5 4 * * *', startDate: dayInMs }});
    expect(perform).toHaveBeenCalledTimes(0);
  });

  it('adds the job on a cron schedule with a start time after a delay.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await expect(adapter.performLater('example', {}, { in: 1000, every: '5 4 * * *' }))
      .resolves.toBeUndefined();
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { repeat: { cron: '5 4 * * *', startDate: 1000 }});
    expect(perform).toHaveBeenCalledTimes(0);
  });

  it('adds the job on a certain millisecond schedule.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await expect(adapter.performLater('example', {}, { every: 1000 }))
      .resolves.toBeUndefined();
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { repeat: { every: 1000 }});
    expect(perform).toHaveBeenCalledTimes(0);
  });

  it('adds the job to be run at a specific date.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await expect(adapter.performLater('example', {}, { at: tomorrow }))
      .resolves.toBeUndefined();
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { delay: dayInMs });
    expect(perform).toHaveBeenCalledTimes(0);
  });

  it('adds the job to be run after a delay.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await expect(adapter.performLater('example', {}, { in: 1000 }))
      .resolves.toBeUndefined();
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, { delay: 1000 });
    expect(perform).toHaveBeenCalledTimes(0);
  });

  it('logs message about a job starting then erroring.', async(): Promise<void> => {
    error = new Error('Job failed');
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await adapter.performLater('example');
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, {});
    expect(on).toHaveBeenCalledTimes(5);
    expect(logger.info).toHaveBeenCalledTimes(3);
    expect(logger.info).toHaveBeenNthCalledWith(1, 'Job example has started on queue default');
    expect(logger.info.mock.calls[1][0].startsWith('Job example on queue default failed with reason: Job failed'))
      .toBe(true);
    expect(logger.info.mock.calls[2][0].startsWith('An error occured in queue default: Job failed'))
      .toBe(true);
  });

  it('logs a message about a job starting then completing.', async(): Promise<void> => {
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await adapter.performLater('example');
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, {});
    expect(on).toHaveBeenCalledTimes(5);
    expect(logger.info).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenNthCalledWith(1, 'Job example has started on queue default');
    expect(logger.info).toHaveBeenNthCalledWith(2, 'Job example successfully completed on queue default');
  });

  it('logs a message about a job starting then becoming stalled then completing.', async(): Promise<void> => {
    stalled = true;
    adapter = new BullQueueAdapter({ jobs, queues, redisConfig });
    await adapter.performLater('example');
    expect(Bull).toHaveBeenCalledTimes(1);
    expect(Bull).toHaveBeenCalledWith('default', { redis: redisConfig });
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(add).toHaveBeenCalledTimes(1);
    expect(add).toHaveBeenCalledWith('example', {}, {});
    expect(on).toHaveBeenCalledTimes(5);
    expect(logger.info).toHaveBeenCalledTimes(3);
    expect(logger.info).toHaveBeenNthCalledWith(1, 'Job example has started on queue default');
    expect(logger.info).toHaveBeenNthCalledWith(2, 'Job example has been marked as stalled on queue default');
    expect(logger.info).toHaveBeenNthCalledWith(3, 'Job example successfully completed on queue default');
  });
});
