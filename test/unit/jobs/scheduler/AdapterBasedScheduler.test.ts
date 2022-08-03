import type { QueueAdapter } from '../../../../src/jobs/adapter/QueueAdapter';
import { AdapterBasedScheduler } from '../../../../src/jobs/scheduler/AdapterBasedScheduler';

describe('An AdapterBasedScheduler', (): void => {
  const jobName = 'sendEmail';
  const data = {};
  const options = {};
  let scheduler: AdapterBasedScheduler;
  let adapter: QueueAdapter;

  beforeEach(async(): Promise<void> => {
    adapter = {
      performLater: jest.fn(),
    };

    scheduler = new AdapterBasedScheduler(adapter);
  });

  it('calls performLater directly on the adapter.', async(): Promise<void> => {
    await expect(scheduler.performLater(jobName, data, options)).resolves.toBeUndefined();
    expect(adapter.performLater).toHaveBeenCalledTimes(1);
    expect(adapter.performLater).toHaveBeenCalledWith(jobName, data, options);
  });
});
