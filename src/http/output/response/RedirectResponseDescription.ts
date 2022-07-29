import type { RedirectHttpError } from '../../../util/errors/RedirectHttpError';
import { ResponseDescription } from './ResponseDescription';

/**
 * Corresponds to a redirect response, containing the relevant location metadata.
 */
export class RedirectResponseDescription extends ResponseDescription {
  public constructor(error: RedirectHttpError) {
    super(error.statusCode);
  }
}
