import { BadRequestHttpError } from '../../../util/errors/BadRequestHttpError';
import type { HttpRequest } from '../../HttpRequest';
import type { ParsedRequest } from '../../ParsedRequest';
import type { BodyParser } from '../body/BodyParser';
import type { UrlExtractor } from '../url/UrlExtractor';
import { RequestParser } from './RequestParser';

/**
 * Input parsers required for a {@link BasicRequestParser}.
 */
export interface BasicRequestParserArgs {
  urlExtractor: UrlExtractor;
  bodyParser: BodyParser;
}

/**
 * Creates an {@link ParsedRequest} from an incoming {@link HttpRequest} by aggregating the results
 * of a {@link UrlExtractor} and {@link BodyParser}.
 */
export class BasicRequestParser extends RequestParser {
  private readonly urlExtractor: UrlExtractor;
  private readonly bodyParser: BodyParser;

  public constructor(args: BasicRequestParserArgs) {
    super();
    this.urlExtractor = args.urlExtractor;
    this.bodyParser = args.bodyParser;
  }

  public async canHandle(request: HttpRequest): Promise<void> {
    if (!request.url) {
      throw new BadRequestHttpError('Cannot handle request without a url');
    }
    if (!request.method) {
      throw new BadRequestHttpError('Cannot handle request without a method');
    }
  }

  public async handle(request: HttpRequest): Promise<ParsedRequest> {
    const { method, headers } = request;
    const url = await this.urlExtractor.handleSafe({ request });
    const data = await this.bodyParser.handleSafe({ request });

    return { method: method!, url, headers, data };
  }
}
