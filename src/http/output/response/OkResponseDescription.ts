import type { Readable } from 'stream';
import type { Guarded } from '../../../util/GuardedStream';
import { ResponseDescription } from './ResponseDescription';

/**
 * Corresponds to a 200 response, containing relevant metadata and potentially data.
 */
export class OkResponseDescription extends ResponseDescription {
  /**
   * @param data - Potential data. @ignored
   */
  public constructor(data?: Guarded<Readable>) {
    super(200, data);
  }
}
