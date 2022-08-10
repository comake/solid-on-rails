import type { Readable } from 'stream';
import type { Guarded } from '../../../util/GuardedStream';
import { ResponseDescription } from './ResponseDescription';

/**
 * Corresponds to a 201 response, containing the relevant location metadata.
 */
export class CreatedResponseDescription extends ResponseDescription {
  /**
   * @param data - Potential data. @ignored
   */
  public constructor(data?: Guarded<Readable>) {
    super(201, data);
  }
}
