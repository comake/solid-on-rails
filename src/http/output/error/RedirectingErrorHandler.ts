import { NotImplementedHttpError } from '../../../util/errors/NotImplementedHttpError';
import { RedirectHttpError } from '../../../util/errors/RedirectHttpError';
import { ResponseDescription } from '../response/ResponseDescription';
import type { ErrorHandlerInput } from './ErrorHandler';
import { ErrorHandler } from './ErrorHandler';

/**
 * Internally we create redirects by throwing specific {@link RedirectHttpError}s.
 * This Error handler converts those to {@link ResponseDescription}s that are used for output.
 */
export class RedirectingErrorHandler extends ErrorHandler {
  public async canHandle({ error }: ErrorHandlerInput): Promise<void> {
    if (!RedirectHttpError.isInstance(error)) {
      throw new NotImplementedHttpError('Only redirect errors are supported.');
    }
  }

  public async handle({ error }: ErrorHandlerInput): Promise<ResponseDescription> {
    // Cast verified by canHandle
    return new ResponseDescription((error as RedirectHttpError).statusCode);
  }
}
