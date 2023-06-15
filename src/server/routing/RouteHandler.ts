import type { ResponseDescription } from '../../http/output/response/ResponseDescription';
import type { ParsedRequestHandlerInput } from '../ParsedRequestHandler';

export type RouteHandlerInput<T = Record<string, unknown>> = ParsedRequestHandlerInput & { params: T };
/**
 * An HTTP request handler.
 */
export abstract class RouteHandler<T = Record<string, unknown>> {
  public abstract handle(input: RouteHandlerInput<T>): Promise<ResponseDescription>;
}
