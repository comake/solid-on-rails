import type { JobSchedule } from '../../../../src/init/initialize/JobSchedulesInitializer';
import { JobSchedulesInitializer } from '../../../../src/init/initialize/JobSchedulesInitializer';
import type { JobScheduler } from '../../../../src/jobs/scheduler/JobScheduler';

describe('A JobSchedulesInitializer', (): void => {
  let schedules: Record<string, JobSchedule>;
  let scheduler: JobScheduler;

  beforeEach(async(): Promise<void> => {
    scheduler = {
      performLater: jest.fn(),
    };

    schedules = {
      example1: {
        jobName: 'scheduledExample',
        cron: '5 4 * * *',
      },
      example2: {
        jobName: 'scheduledExample2',
        cron: '* * * 1 *',
        data: { alpha: 1 },
      },
    };
  });

  it('schedules preconfigured jobs.', async(): Promise<void> => {
    const initializer = new JobSchedulesInitializer(scheduler, schedules);
    await expect(initializer.handle()).resolves.toBeUndefined();
    expect(scheduler.performLater).toHaveBeenCalledTimes(2);
    expect(scheduler.performLater)
      .toHaveBeenNthCalledWith(1, 'scheduledExample', undefined, { every: '5 4 * * *' });
    expect(scheduler.performLater)
      .toHaveBeenNthCalledWith(2, 'scheduledExample2', { alpha: 1 }, { every: '* * * 1 *' });
  });

  it('does not schedule any jobs when none are supplied.', async(): Promise<void> => {
    const initializer = new JobSchedulesInitializer(scheduler, {});
    await expect(initializer.handle()).resolves.toBeUndefined();
    expect(scheduler.performLater).toHaveBeenCalledTimes(0);
  });
});
