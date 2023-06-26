import { AsyncHandler } from '../../../util/handlers/AsyncHandler';
import type { HttpHandlerInput } from '../../handler/HttpHandler';
import type { ResponseDescription } from '../response/ResponseDescription';

export interface ErrorHandlerInput extends HttpHandlerInput {
  error: Error;
}

/**
 * Converts an error into a {@link ResponseDescription} based on the request preferences.
 */
export abstract class ErrorHandler extends AsyncHandler<ErrorHandlerInput, ResponseDescription> {}
