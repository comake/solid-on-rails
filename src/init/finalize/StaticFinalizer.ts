import type { Finalizable } from './Finalizable';

/**
 * A finalizer that does nothing.
 */
export class StaticFinalizer implements Finalizable {
  public async finalize(): Promise<void> {
    // Do nothing
  }
}
