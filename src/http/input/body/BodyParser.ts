import type { Readable } from 'stream';
import type { Guarded } from '../../../util/GuardedStream';
import { AsyncHandler } from '../../../util/handlers/AsyncHandler';
import type { HttpRequest } from '../../HttpRequest';

export interface BodyParserArgs {
  /**
   * Request that contains the (potential) body.
   */
  request: HttpRequest;
}

/**
 * Parses the body of an incoming {@link HttpRequest} and converts it to a {@link Readable}.
 */
export abstract class BodyParser extends AsyncHandler<BodyParserArgs, Guarded<Readable>> {}
