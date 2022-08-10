import type { Readable } from 'stream';
import type { Guarded } from '../util/GuardedStream';
import type { HttpRequest } from './HttpRequest';
/**
 * A single REST operation.
 */
export interface ParsedRequest {
  /**
   * The HTTP method (GET/POST/PUT/PATCH/DELETE/etc.).
   */
  method: string;
  /**
   * A URL object combining the origin and path of the request.
   */
  url: URL;
  /**
   * The headers of the request.
   */
  headers: HttpRequest['headers'];
  /**
   * The raw data stream for this request.
   */
  data: Guarded<Readable>;
  /**
   * Named parameters from the path of the URL.
   */
  pathParams?: Record<string, string>;
}
