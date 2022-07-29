import { ParsingHttpHandler } from '../../../../src/http/handler/ParsingHttpHandler';
import type { HttpRequest } from '../../../../src/http/HttpRequest';
import type { HttpResponse } from '../../../../src/http/HttpResponse';
import type { RequestParser } from '../../../../src/http/input/parser/RequestParser';
import type { ErrorHandler } from '../../../../src/http/output/error/ErrorHandler';
import { ResponseDescription } from '../../../../src/http/output/response/ResponseDescription';
import type { ResponseWriter } from '../../../../src/http/output/ResponseWriter';
import type { ParsedRequest } from '../../../../src/http/ParsedRequest';
import type { ParsedRequestHandler } from '../../../../src/server/ParsedRequestHandler';
import { HttpError } from '../../../../src/util/errors/HttpError';
import { guardedStreamFrom } from '../../../../src/util/StreamUtil';

describe('A ParsingHttpHandler', (): void => {
  const request: HttpRequest = {} as any;
  const response: HttpResponse = {} as any;
  const parsedRequest: ParsedRequest = {} as any;
  let errorResponse: ResponseDescription;
  let requestParser: jest.Mocked<RequestParser>;
  let errorHandler: jest.Mocked<ErrorHandler>;
  let responseWriter: jest.Mocked<ResponseWriter>;
  let requestHandler: jest.Mocked<ParsedRequestHandler>;
  let handler: ParsingHttpHandler;

  beforeEach(async(): Promise<void> => {
    errorResponse = new ResponseDescription(400);
    requestParser = { handleSafe: jest.fn().mockResolvedValue(parsedRequest) } as any;
    errorHandler = { handleSafe: jest.fn().mockResolvedValue(errorResponse) } as any;
    responseWriter = { handleSafe: jest.fn() } as any;
    requestHandler = { handleSafe: jest.fn() } as any;

    handler = new ParsingHttpHandler(
      { requestParser, errorHandler, responseWriter, requestHandler },
    );
  });

  it('calls the requestHandler with the generated ParsedRequest.', async(): Promise<void> => {
    await expect(handler.handle({ request, response })).resolves.toBeUndefined();
    expect(requestParser.handleSafe).toHaveBeenCalledTimes(1);
    expect(requestParser.handleSafe).toHaveBeenLastCalledWith(request);
    expect(requestHandler.handleSafe).toHaveBeenCalledTimes(1);
    expect(requestHandler.handleSafe).toHaveBeenLastCalledWith({ request: parsedRequest, response });
    expect(errorHandler.handleSafe).toHaveBeenCalledTimes(0);
    expect(responseWriter.handleSafe).toHaveBeenCalledTimes(0);
  });

  it('calls the responseWriter if there is a response.', async(): Promise<void> => {
    const result = new ResponseDescription(200);
    requestHandler.handleSafe.mockResolvedValueOnce(result);
    await expect(handler.handle({ request, response })).resolves.toBeUndefined();
    expect(requestParser.handleSafe).toHaveBeenCalledTimes(1);
    expect(requestParser.handleSafe).toHaveBeenLastCalledWith(request);
    expect(requestHandler.handleSafe).toHaveBeenCalledTimes(1);
    expect(requestHandler.handleSafe).toHaveBeenLastCalledWith({ request: parsedRequest, response });
    expect(errorHandler.handleSafe).toHaveBeenCalledTimes(0);
    expect(responseWriter.handleSafe).toHaveBeenCalledTimes(1);
    expect(responseWriter.handleSafe).toHaveBeenLastCalledWith({ response, result });
  });

  it('calls the error handler if something goes wrong.', async(): Promise<void> => {
    const error = new Error('bad data');
    requestHandler.handleSafe.mockRejectedValueOnce(error);
    await expect(handler.handle({ request, response })).resolves.toBeUndefined();
    expect(errorHandler.handleSafe).toHaveBeenCalledTimes(1);
    expect(errorHandler.handleSafe).toHaveBeenLastCalledWith({ error });
    expect(responseWriter.handleSafe).toHaveBeenCalledTimes(1);
    expect(responseWriter.handleSafe).toHaveBeenLastCalledWith({ response, result: errorResponse });
  });

  it('adds error data if able.', async(): Promise<void> => {
    const error = new HttpError(0, 'error');
    requestHandler.handleSafe.mockRejectedValueOnce(error);
    errorResponse = new ResponseDescription(0, guardedStreamFrom('Super bad error'));
    errorHandler.handleSafe.mockResolvedValueOnce(errorResponse);
    await expect(handler.handle({ request, response })).resolves.toBeUndefined();
    expect(requestParser.handleSafe).toHaveBeenCalledTimes(1);
    expect(requestParser.handleSafe).toHaveBeenLastCalledWith(request);
    expect(errorHandler.handleSafe).toHaveBeenCalledTimes(1);
    expect(errorHandler.handleSafe).toHaveBeenLastCalledWith({ error });
    expect(responseWriter.handleSafe).toHaveBeenCalledTimes(1);
    expect(responseWriter.handleSafe).toHaveBeenLastCalledWith({ response, result: errorResponse });
  });
});
