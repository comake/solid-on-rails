import { getLoggerFor } from '../../../logging/LogUtil';
import { APPLICATION_JSON } from '../../../util/ContentTypes';
import { createErrorMessage } from '../../../util/errors/ErrorUtil';
import { getStatusCode } from '../../../util/errors/HttpErrorUtil';
import { addHeader } from '../../../util/HeaderUtil';
import { guardedStreamFrom, guardedStreamFromJson } from '../../../util/StreamUtil';
import type { ResponseDescription } from '../response/ResponseDescription';
import type { ErrorHandlerInput } from './ErrorHandler';
import { ErrorHandler } from './ErrorHandler';

/**
 * Returns a simple text description of an error.
 * This class is a failsafe in case the wrapped error handler fails.
 */
export class SafeErrorHandler extends ErrorHandler {
  protected readonly logger = getLoggerFor(this);

  private readonly errorHandler: ErrorHandler;
  private readonly showStackTrace: boolean;

  public constructor(errorHandler: ErrorHandler, showStackTrace = false) {
    super();
    this.errorHandler = errorHandler;
    this.showStackTrace = showStackTrace;
  }

  public async handle(input: ErrorHandlerInput): Promise<ResponseDescription> {
    try {
      return await this.errorHandler.handleSafe(input);
    } catch (error: unknown) {
      this.logger.debug(`Recovering from error handler failure: ${createErrorMessage(error)}`);
    }
    const { error, request, response } = input;
    const statusCode = getStatusCode(error);

    let data: any;
    const { 'content-type': contentType } = request.headers;
    if (contentType === APPLICATION_JSON) {
      addHeader(response, 'Content-Type', APPLICATION_JSON);
      data = guardedStreamFromJson({
        error: {
          code: statusCode,
          name: error.name,
          message: typeof error.stack === 'string' && this.showStackTrace
            ? error.stack
            : error.message,
        },
      });
    } else {
      const text = typeof error.stack === 'string' && this.showStackTrace
        ? `${error.stack}\n`
        : `${error.name}: ${error.message}\n`;
      data = guardedStreamFrom(text);
    }
    return {
      statusCode,
      data,
    };
  }
}
