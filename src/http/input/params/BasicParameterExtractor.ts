import type { Key } from 'path-to-regexp';
import queryString from 'query-string';
import { safeReadJsonStream } from '../../../util/StreamUtil';
import type { ParsedRequest } from '../../ParsedRequest';
import type { ParameterExtractorArgs } from './ParameterExtractor';
import { ParameterExtractor } from './ParameterExtractor';

/**
 * Extracts the parameters from a {@link ParsedRequest}.
 */
export class BasicParameterExtractor extends ParameterExtractor {
  public async handle({ request, pathRegex, pathKeys }: ParameterExtractorArgs): Promise<NodeJS.Dict<any>> {
    const pathParams = this.getPathParams(request, pathRegex, pathKeys);
    const queryParams = this.getQueryParams(request);
    const bodyParams = await this.getBodyParams(request);
    return {
      ...bodyParams,
      ...queryParams,
      ...pathParams,
    };
  }

  private getPathParams(request: ParsedRequest, pathRegex: RegExp, pathKeys: Key[]): NodeJS.Dict<any> {
    const pathVars = pathRegex.exec(request.url.pathname);
    if (pathVars && pathKeys.length > 0) {
      return pathKeys.reduce((
        obj: NodeJS.Dict<any>,
        key: Key,
        index: number,
      ): NodeJS.Dict<any> => ({
        ...obj,
        [key.name]: pathVars[index + 1],
      }), {});
    }
    return {};
  }

  private getQueryParams(request: ParsedRequest): NodeJS.Dict<any> {
    const { search } = request.url;
    return queryString.parse(search, { arrayFormat: 'bracket' });
  }

  private async getBodyParams(request: ParsedRequest): Promise<NodeJS.Dict<any>> {
    const { 'content-type': contentType } = request.headers;
    if (request.method === 'POST' && contentType === 'application/json') {
      return await safeReadJsonStream(request.data);
    }
    return {};
  }
}
