import { AsyncHandler } from '../../util/handlers/AsyncHandler';
import type { HttpResponse } from '../HttpResponse';
import type { ResponseDescription } from './response/ResponseDescription';

/**
 * Writes the ResponseDescription to the HttpResponse.
 */
export abstract class ResponseWriter
  extends AsyncHandler<{ response: HttpResponse; result: ResponseDescription }> {}
