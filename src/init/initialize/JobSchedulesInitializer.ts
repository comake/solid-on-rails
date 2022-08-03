/* eslint-disable tsdoc/syntax */
import type { JobScheduler } from '../../jobs/scheduler/JobScheduler';
import { Initializer } from './Initializer';

export interface JobSchedule {
  cron: string;
  jobName: string;
  queue?: string;
  data?: Record<string, any>;
}

export interface JobSchedulesInitializerArgs {
  scheduler: JobScheduler;
  schedules?: Record<string, JobSchedule>;
}

/**
 * Schedules preconfigured jobs.
 */
export class JobSchedulesInitializer extends Initializer {
  private readonly scheduler: JobScheduler;
  private readonly schedules: Record<string, JobSchedule>;

  /**
   * @param scheduler - the scheduler to send jobs to be queued.
   * @param schedules - the preconfigured schedules for specific jobs to be run on. @range {json}
   */
  public constructor(scheduler: JobScheduler, schedules: Record<string, JobSchedule> = {}) {
    super();
    this.scheduler = scheduler;
    this.schedules = schedules;
  }

  public async handle(): Promise<void> {
    await Promise.all(
      Object.values(this.schedules).map(
        async(schedule: JobSchedule): Promise<void> => {
          const options = {
            every: schedule.cron,
            queue: schedule.queue,
          };
          await this.scheduler.performLater(
            schedule.jobName,
            schedule.data,
            options,
          );
        },
      ),
    );
  }
}
