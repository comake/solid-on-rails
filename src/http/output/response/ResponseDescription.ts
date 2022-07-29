import type { Readable } from 'stream';
import type { Guarded } from '../../../util/GuardedStream';

/**
 * The result of executing an operation.
 */
export class ResponseDescription {
  public readonly statusCode: number;
  public readonly data?: Guarded<Readable>;

  /**
   * @param statusCode - Status code to return.
   * @param data - Data that needs to be returned. @ignored
   */
  public constructor(statusCode: number, data?: Guarded<Readable>) {
    this.statusCode = statusCode;
    this.data = data;
  }
}
