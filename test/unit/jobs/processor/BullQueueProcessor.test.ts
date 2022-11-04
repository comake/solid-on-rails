import type { Queue } from 'bull';
import type { QueueAdapter } from '../../../../src/jobs/adapter/QueueAdapter';
import type { Job } from '../../../../src/jobs/Job';
import { BullQueueProcessor } from '../../../../src/jobs/processor/BullQueueProcessor';
import type { Logger } from '../../../../src/logging/Logger';
import { getLoggerFor } from '../../../../src/logging/LogUtil';

jest.mock('../../../../src/logging/LogUtil', (): any => {
  const logger: Logger = { info: jest.fn() } as any;
  return { getLoggerFor: (): Logger => logger };
});
const logger: jest.Mocked<Logger> = getLoggerFor('StreamUtil') as any;

describe('A BullQueueProcessor', (): void => {
  let queues: Record<string, Queue>;
  let perform: Job['perform'];
  let job: Job;
  let jobs: Record<string, Job>;
  let process: any;
  let add: any;
  let on: any;
  let processor: BullQueueProcessor;
  let registeredJobs: Record<string, (data: any) => Promise<void>>;
  let registeredEvents: Record<string, (...args: any[]) => void>;
  let error: Error | undefined;
  let stalled: boolean;
  let adapter: QueueAdapter;

  beforeEach(async(): Promise<void> => {
    jest.clearAllMocks();

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

    registeredJobs = {};
    process = jest.fn().mockImplementation(
      (jobName: string, concurrency: number, processFn: (bullJob: any) => Promise<void>): void => {
        registeredJobs[jobName] = processFn;
      },
    );

    registeredEvents = {};
    on = jest.fn().mockImplementation((event: string, handler: () => void): void => {
      registeredEvents[event] = handler;
    });

    queues = { default: { process, add, on, name: 'default' } as any };
    perform = jest.fn();
    job = { perform, options: { queue: 'default' }};
    jobs = { example: job };

    adapter = { } as any;
    processor = new BullQueueProcessor();
  });

  it('initializes processing on the queues.', async(): Promise<void> => {
    processor.processJobsOnQueues(queues, jobs, adapter);
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(process.mock.calls[0][1]).toBe(1);
    expect(on).toHaveBeenCalledTimes(5);
  });

  it('initializes queues with only one total concurrent job.', async(): Promise<void> => {
    jobs = { example: job, example2: job };
    processor.processJobsOnQueues(queues, jobs, adapter);
    expect(process).toHaveBeenCalledTimes(2);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(process.mock.calls[0][1]).toBe(1);
    expect(process.mock.calls[1][0]).toBe('example2');
    expect(process.mock.calls[1][1]).toBe(0);
    expect(on).toHaveBeenCalledTimes(5);
  });

  it('logs a message about a job starting then erroring.', async(): Promise<void> => {
    error = new Error('Job failed');
    processor.processJobsOnQueues(queues, jobs, adapter);
    await queues.default.add('example', {}, {});
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(process.mock.calls[0][1]).toBe(1);
    expect(on).toHaveBeenCalledTimes(5);
    expect(logger.info).toHaveBeenCalledTimes(3);
    expect(logger.info).toHaveBeenNthCalledWith(1, 'Job example has started on queue default');
    expect(logger.info.mock.calls[1][0].startsWith('Job example on queue default failed with reason: Job failed'))
      .toBe(true);
    expect(logger.info.mock.calls[2][0].startsWith('An error occured in queue default: Job failed'))
      .toBe(true);
  });

  it('logs a message about a job starting then completing.', async(): Promise<void> => {
    processor.processJobsOnQueues(queues, jobs, adapter);
    await queues.default.add('example', {}, {});
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(process.mock.calls[0][1]).toBe(1);
    expect(on).toHaveBeenCalledTimes(5);
    expect(logger.info).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenNthCalledWith(1, 'Job example has started on queue default');
    expect(logger.info).toHaveBeenNthCalledWith(2, 'Job example successfully completed on queue default');
  });

  it('logs a message about a job starting then becoming stalled then completing.', async(): Promise<void> => {
    stalled = true;
    processor.processJobsOnQueues(queues, jobs, adapter);
    await queues.default.add('example', {}, {});
    expect(process).toHaveBeenCalledTimes(1);
    expect(process.mock.calls[0][0]).toBe('example');
    expect(process.mock.calls[0][1]).toBe(1);
    expect(on).toHaveBeenCalledTimes(5);
    expect(logger.info).toHaveBeenCalledTimes(3);
    expect(logger.info).toHaveBeenNthCalledWith(1, 'Job example has started on queue default');
    expect(logger.info).toHaveBeenNthCalledWith(2, 'Job example has been marked as stalled on queue default');
    expect(logger.info).toHaveBeenNthCalledWith(3, 'Job example successfully completed on queue default');
  });
});
