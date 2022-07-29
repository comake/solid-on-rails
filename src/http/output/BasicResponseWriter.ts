import { getLoggerFor } from '../../logging/LogUtil';
import { pipeSafely } from '../../util/StreamUtil';
import type { HttpResponse } from '../HttpResponse';
import type { ResponseDescription } from './response/ResponseDescription';
import { ResponseWriter } from './ResponseWriter';

/**
 * Writes to an {@link HttpResponse} based on the incoming {@link ResponseDescription}.
 */
export class BasicResponseWriter extends ResponseWriter {
  protected readonly logger = getLoggerFor(this);

  public constructor() {
    super();
  }

  public async handle(input: { response: HttpResponse; result: ResponseDescription }): Promise<void> {
    input.response.writeHead(input.result.statusCode);

    if (input.result.data) {
      const pipe = pipeSafely(input.result.data, input.response);
      pipe.on('error', (error): void => {
        this.logger.error(`Aborting streaming response because of server error; headers already sent.`);
        this.logger.error(`Response error: ${error.message}`);
      });
    } else {
      // If there is input data the response will end once the input stream ends
      input.response.end();
    }
  }
}
