import type { JobSchedule } from '../../../../src/jobs/scheduler/ConfigJobScheduler';
import { ConfigJobScheduler } from '../../../../src/jobs/scheduler/ConfigJobScheduler';
import type { JobScheduler } from '../../../../src/jobs/scheduler/JobScheduler';

describe('A ConfigJobScheduler', (): void => {
  let schedules: JobSchedule[];
  let scheduler: ConfigJobScheduler;
  let subScheduler: JobScheduler;

  beforeEach(async(): Promise<void> => {
    subScheduler = {
      performLater: jest.fn(),
    };

    schedules = [
      {
        jobName: 'scheduledExample',
        cron: '5 4 * * *',
      },
      {
        jobName: 'scheduledExample2',
        cron: '* * * 1 *',
        data: { alpha: 1 },
      },
    ];
  });

  it('calls performLater directly on the scheduler.', async(): Promise<void> => {
    const data = {};
    const options = {};
    scheduler = new ConfigJobScheduler({ scheduler: subScheduler, schedules: []});
    await expect(scheduler.performLater('sendEmail', data, options)).resolves.toBeUndefined();
    expect(subScheduler.performLater).toHaveBeenCalledTimes(1);
    expect(subScheduler.performLater).toHaveBeenCalledWith('sendEmail', data, options);
  });

  it('schedules preconfigured jobs.', async(): Promise<void> => {
    scheduler = new ConfigJobScheduler({ scheduler: subScheduler, schedules });
    expect(subScheduler.performLater).toHaveBeenCalledTimes(2);
    expect(subScheduler.performLater)
      .toHaveBeenNthCalledWith(1, 'scheduledExample', undefined, { every: '5 4 * * *' });
    expect(subScheduler.performLater)
      .toHaveBeenNthCalledWith(2, 'scheduledExample2', { alpha: 1 }, { every: '* * * 1 *' });
  });
});
