import type { Readable } from 'stream';
import { getLoggerFor } from '../../../logging/LogUtil';
import { BadRequestHttpError } from '../../../util/errors/BadRequestHttpError';
import type { Guarded } from '../../../util/GuardedStream';
import { guardStream } from '../../../util/GuardedStream';
import { guardedStreamFrom } from '../../../util/StreamUtil';
import type { BodyParserArgs } from './BodyParser';
import { BodyParser } from './BodyParser';

/**
 * Converts incoming {@link HttpRequest} to a Representation without any further parsing.
 */
export class RawBodyParser extends BodyParser {
  protected readonly logger = getLoggerFor(this);

  // Note that the only reason this is a union is in case the body is empty.
  // If this check gets moved away from the BodyParsers this union could be removed
  public async handle({ request }: BodyParserArgs): Promise<Guarded<Readable>> {
    const {
      'content-type': contentType,
      'content-length': contentLength,
      'transfer-encoding': transferEncoding,
    } = request.headers;

    // RFC7230, §3.3: The presence of a message body in a request
    // is signaled by a Content-Length or Transfer-Encoding header field.
    // While clients SHOULD NOT use use a Content-Length header on GET,
    // some still provide a Content-Length of 0 (but without Content-Type).
    if ((!contentLength || (/^0+$/u.test(contentLength) && !contentType)) && !transferEncoding) {
      this.logger.debug('HTTP request does not have a body, or its empty body is missing a Content-Type header');
      return this.toGuardedStream([]);
    }

    // While RFC7231 allows treating a body without content type as an octet stream,
    // such an omission likely signals a mistake, so force clients to make this explicit.
    if (!contentType) {
      this.logger.warn('HTTP request has a body, but no Content-Type header');
      throw new BadRequestHttpError('HTTP request body was passed without a Content-Type header');
    }

    return this.toGuardedStream(request);
  }

  private toGuardedStream(data: Guarded<Readable> | Readable | any[] | string): Guarded<Readable> {
    if (typeof data === 'string' || Array.isArray(data)) {
      data = guardedStreamFrom(data);
    }
    return guardStream(data);
  }
}
