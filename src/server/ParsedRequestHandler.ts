import type { HttpResponse } from '../http/HttpResponse';
import type { ResponseDescription } from '../http/output/response/ResponseDescription';
import type { ParsedRequest } from '../http/ParsedRequest';
import { AsyncHandler } from '../util/handlers/AsyncHandler';

export type ParsedRequestHandlerInput = {
  request: ParsedRequest;
  response: HttpResponse;
};

/**
 * An HTTP request handler.
 */
export abstract class ParsedRequestHandler extends AsyncHandler<ParsedRequestHandlerInput, ResponseDescription> {}
