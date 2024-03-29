/* eslint-disable @typescript-eslint/naming-convention */
import Bull from 'bull';
import type { App } from '../../src/init/App';
import { BullQueueAdapter } from '../../src/jobs/adapter/BullQueueAdapter';
import { BullQueueProcessor } from '../../src/jobs/processor/BullQueueProcessor';
import { getPort } from '../util/Util';
import { getTestConfigPath, instantiateFromConfig, getDefaultVariables } from './Config';

const port = getPort('Job');
const baseUrl = `http://localhost:${port}`;

jest.mock('bull');

describe('An http server with preconfigured jobs', (): void => {
  const redisConfig = { port: 6379, host: '127.0.0.1' };
  let app: App;
  let jobValue = '';
  let process: any;
  let add: any;
  let on: any;
  let bullConstructor: any;
  let registeredJobs: Record<string, any>;

  beforeEach(async(): Promise<void> => {
    registeredJobs = {};
    process = jest.fn().mockImplementation(
      (jobName: string, concurrency: number, processFn: (bullJob: any) => Promise<void>): void => {
        registeredJobs[jobName] = {
          perform: processFn,
          id: 'jobId',
          queue: { name: 'default' },
        };
      },
    );

    add = jest.fn().mockImplementation(
      async(jobName: string, data: any): Promise<any> => {
        const job = registeredJobs[jobName];
        await registeredJobs[jobName].perform({ data });
        return job;
      },
    );

    on = jest.fn();

    bullConstructor = jest.fn().mockImplementation((): Bull.Queue => ({ process, add, on } as any));
    (Bull as jest.Mock).mockImplementation(bullConstructor);

    const adapter = new BullQueueAdapter(
      [{
        name: 'Void',
        options: { queue: 'default' },
        perform: jest.fn().mockImplementation(async({ value }: { value: string }): Promise<void> => {
          jobValue = value;
        }),
      }],
      { default: {}},
      redisConfig,
      new BullQueueProcessor(),
    );

    const instances = await instantiateFromConfig(
      'urn:solid-on-rails:test:Instances',
      getTestConfigPath('configured-jobs.json'),
      {
        ...getDefaultVariables(port, baseUrl),
        'urn:solid-on-rails:default:QueueAdapter': adapter,
      },
    ) as Record<string, any>;
    ({ app } = instances);
    await app.start();
  });

  afterEach(async(): Promise<void> => {
    await app.stop();
  });

  it('runs the scheduled jobs after the server is started.', async(): Promise<void> => {
    expect(jobValue).toBe('test value');
  });
});
