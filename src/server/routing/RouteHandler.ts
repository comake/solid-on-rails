/* eslint-disable tsdoc/syntax */
// tsdoc/syntax cannot handle `@range`
import type { Key } from 'path-to-regexp';
import { pathToRegexp } from 'path-to-regexp';
import type { ResponseDescription } from '../../http/output/response/ResponseDescription';
import { MethodNotAllowedHttpError } from '../../util/errors/MethodNotAllowedHttpError';
import { NotFoundHttpError } from '../../util/errors/NotFoundHttpError';
import { ParsedRequestHandler } from '../ParsedRequestHandler';
import type { ParsedRequestHandlerInput } from '../ParsedRequestHandler';

export type Subdomain = string | string[] | RegExp;

export interface Route {
  path: string;
  method: string;
  subdomain?: Subdomain;
}
/**
 * Handles requests for a particular route. Matches the parsed url object against
 * a method, subdomain, and path.
 */
export class RouteHandler extends ParsedRequestHandler {
  private readonly pathRegex: RegExp;
  private readonly pathKeys: Key[] = [];
  private readonly method: string;
  private readonly subdomain?: Subdomain;
  private readonly handler: ParsedRequestHandler;

  /**
   * @param route - JSON config describing the route to match against. @range {json}
   * @param handler - The handler to send the request to.
   */
  public constructor(route: Route, handler: ParsedRequestHandler) {
    super();
    this.pathRegex = pathToRegexp(route.path, this.pathKeys);
    this.method = route.method;
    this.subdomain = route.subdomain;
    this.handler = handler;
  }

  public async canHandle(input: ParsedRequestHandlerInput): Promise<void> {
    const { request: { url, method }} = input;

    if (this.method !== method) {
      throw new MethodNotAllowedHttpError([ method ], `${method} is not allowed.`);
    }
    if (!this.urlMatchesSubdomain(url)) {
      throw new NotFoundHttpError(`Cannot handle subdomain of ${url.host}`);
    }
    if (!this.pathRegex.test(url.pathname)) {
      throw new NotFoundHttpError(`Cannot handle route ${url.pathname}`);
    }
    await this.handler.canHandle(input);
  }

  public async handle(input: ParsedRequestHandlerInput): Promise<ResponseDescription> {
    input.request.pathParams = this.getPathParams(input.request.url.pathname);
    return await this.handler.handle(input);
  }

  private urlMatchesSubdomain(url: URL): boolean {
    const subdomain = this.getSubdomainFromUrl(url);
    if (this.subdomain && subdomain.length > 0) {
      if (typeof this.subdomain === 'string') {
        return subdomain === this.subdomain;
      }
      if (this.subdomain instanceof RegExp) {
        return this.subdomain.test(subdomain);
      }
      if (Array.isArray(this.subdomain)) {
        return this.subdomain.includes(subdomain);
      }
    } else if (!this.subdomain && subdomain.length === 0) {
      return true;
    }
    return false;
  }

  private getSubdomainFromUrl(url: URL): string {
    return url.host.split('.').slice(0, -2).join('.');
  }

  private getPathParams(path: string): Record<string, string> {
    const pathVars = this.pathRegex.exec(path);
    if (pathVars) {
      return this.pathKeys.reduce((
        obj: Record<string, string>,
        key: Key,
        index: number,
      ): Record<string, string> => {
        obj[key.name] = pathVars[index + 1];
        return obj;
      }, {});
    }
    return {};
  }
}
