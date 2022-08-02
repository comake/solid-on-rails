import type { Job } from './Job';

/**
 * A job that does nothing.
 */
export class VoidJob implements Job {
  public async perform(): Promise<void> {
    // Do nothing
  }
}
