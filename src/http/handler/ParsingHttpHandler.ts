import { getLoggerFor } from '../../logging/LogUtil';
import type { ParsedRequestHandler } from '../../server/ParsedRequestHandler';
import { assertError } from '../../util/errors/ErrorUtil';
import type { RequestParser } from '../input/parser/RequestParser';
import type { ErrorHandler } from '../output/error/ErrorHandler';
import type { ResponseDescription } from '../output/response/ResponseDescription';
import type { ResponseWriter } from '../output/ResponseWriter';
import type { HttpHandlerInput } from './HttpHandler';
import { HttpHandler } from './HttpHandler';

export interface ParsingHttpHandlerArgs {
  /**
   * Parses the incoming requests.
   */
  requestParser: RequestParser;
  /**
   * Converts errors to a serializable format.
   */
  errorHandler: ErrorHandler;
  /**
   * Writes out the response of the operation.
   */
  responseWriter: ResponseWriter;
  /**
   * Handler to send the operation to.
   */
  requestHandler: ParsedRequestHandler;
}

/**
 * Parses requests and sends the resulting Operation to wrapped requestHandler.
 * Errors are caught and handled by the Errorhandler.
 * In case the requestHandler returns a result it will be sent to the ResponseWriter.
 */
export class ParsingHttpHandler extends HttpHandler {
  private readonly logger = getLoggerFor(this);

  private readonly requestParser: RequestParser;
  private readonly errorHandler: ErrorHandler;
  private readonly responseWriter: ResponseWriter;
  private readonly requestHandler: ParsedRequestHandler;

  public constructor(args: ParsingHttpHandlerArgs) {
    super();
    this.requestParser = args.requestParser;
    this.errorHandler = args.errorHandler;
    this.responseWriter = args.responseWriter;
    this.requestHandler = args.requestHandler;
  }

  public async handle({ request, response }: HttpHandlerInput): Promise<void> {
    let result: ResponseDescription | undefined;

    try {
      const parsedRequest = await this.requestParser.handleSafe(request);
      result = await this.requestHandler.handleSafe({ request: parsedRequest, response });
      this.logger.verbose(`Parsed ${request.method} operation on ${request.url}`);
    } catch (error: unknown) {
      assertError(error);
      result = await this.errorHandler.handleSafe({ error, request, response });
    }

    if (result) {
      await this.responseWriter.handleSafe({ response, result });
    }
  }
}
