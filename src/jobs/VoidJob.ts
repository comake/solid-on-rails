import { Job } from './Job';

/**
 * A job that does nothing.
 */
export class VoidJob extends Job {
  public async perform(): Promise<void> {
    // Do nothing
  }
}
