import { Job } from './Job';
import type { ConfiguredJobOptions } from './JobOptions';

/**
 * A job that does nothing.
 */
export class VoidJob extends Job {
  public readonly name: string = 'Void';

  public constructor(options?: ConfiguredJobOptions) {
    super(options);
  }

  public async perform(): Promise<void> {
    // Do nothing
  }
}
