import type { HttpResponse } from '../../http/HttpResponse';
import type { ResponseDescription } from '../../http/output/response/ResponseDescription';
import type { ParsedRequest } from '../../http/ParsedRequest';

export type ValidatedRouteHandlerInput<T = any> = {
  params: T;
  request: ParsedRequest;
  response: HttpResponse;
};
/**
 * An HTTP request handler.
 */
export abstract class RouteHandler<T = any> {
  public abstract handle(input: T): Promise<ResponseDescription>;
}
