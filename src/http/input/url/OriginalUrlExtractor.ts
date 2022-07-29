import type { TLSSocket } from 'tls';
import { BadRequestHttpError } from '../../../util/errors/BadRequestHttpError';
import { InternalServerError } from '../../../util/errors/InternalServerError';
import { parseForwarded } from '../../../util/HeaderUtil';
import { toCanonicalUriPath } from '../../../util/PathUtil';
import type { HttpRequest } from '../../HttpRequest';
import { UrlExtractor } from './UrlExtractor';

export interface OriginalUrlExtractorArgs {
  /**
   * Specify wether the OriginalUrlExtractor should include the request query string.
   */
  includeQueryString?: boolean;
}

/**
 * Reconstructs the original URL of an incoming {@link HttpRequest}.
 */
export class OriginalUrlExtractor extends UrlExtractor {
  private readonly includeQueryString: boolean;

  public constructor(args: OriginalUrlExtractorArgs) {
    super();
    this.includeQueryString = args.includeQueryString ?? true;
  }

  public async handle({ request: { url, connection, headers }}: { request: HttpRequest }): Promise<URL> {
    if (!url) {
      throw new InternalServerError('Missing URL');
    }

    // Extract host and protocol (possibly overridden by the Forwarded/X-Forwarded-* header)
    let { host } = headers;
    let protocol = (connection as TLSSocket)?.encrypted ? 'https' : 'http';

    // Check Forwarded/X-Forwarded-* headers
    const forwarded = parseForwarded(headers);
    if (forwarded.host) {
      ({ host } = forwarded);
    }
    if (forwarded.proto) {
      ({ proto: protocol } = forwarded);
    }

    // Perform a sanity check on the host
    if (!host) {
      throw new BadRequestHttpError('Missing Host header');
    }
    if (/[/\\*]/u.test(host)) {
      throw new BadRequestHttpError(`The request has an invalid Host header: ${host}`);
    }

    // URL object applies punycode encoding to domain
    const originalUrl = new URL(`${protocol}://${host}`);
    const [ , pathname, search ] = /^([^?]*)(.*)/u.exec(toCanonicalUriPath(url))!;
    originalUrl.pathname = pathname;
    if (this.includeQueryString && search) {
      originalUrl.search = search;
    }

    return originalUrl;
  }
}
