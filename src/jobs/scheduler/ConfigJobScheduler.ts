import type { JobScheduler, JobOptions } from './JobScheduler';

export interface JobSchedule {
  cron: string;
  jobName: string;
  queue?: string;
  data?: Record<string, any>;
}

export interface ConfigJobSchedulerArgs {
  scheduler: JobScheduler;
  schedules: JobSchedule[];
}

export class ConfigJobScheduler implements JobScheduler {
  private readonly scheduler: JobScheduler;
  private readonly schedules: JobSchedule[];

  public constructor(args: ConfigJobSchedulerArgs) {
    this.scheduler = args.scheduler;
    this.schedules = args.schedules;
    this.scheduleScheduledJobs()
      .catch((err): void => {
        throw err;
      });
  }

  public async performLater(
    jobName: string,
    data?: Record<string, any>,
    options: JobOptions = {},
  ): Promise<void> {
    await this.scheduler.performLater(jobName, data, options);
  }

  private async scheduleScheduledJobs(): Promise<void> {
    this.schedules.forEach(async(schedule: JobSchedule): Promise<void> => {
      const options = {
        every: schedule.cron,
        queue: schedule.queue,
      };
      await this.performLater(
        schedule.jobName,
        schedule.data,
        options,
      );
    });
  }
}
