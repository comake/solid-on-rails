/* eslint-disable @typescript-eslint/naming-convention */
import type { HttpRequest } from '../../../../../src/http/HttpRequest';
import type { HttpResponse } from '../../../../../src/http/HttpResponse';
import type { ErrorHandler } from '../../../../../src/http/output/error/ErrorHandler';
import { SafeErrorHandler } from '../../../../../src/http/output/error/SafeErrorHandler';
import { APPLICATION_JSON } from '../../../../../src/util/ContentTypes';
import { NotFoundHttpError } from '../../../../../src/util/errors/NotFoundHttpError';
import { readableToString, guardedStreamFrom, readJsonStream } from '../../../../../src/util/StreamUtil';

describe('A SafeErrorHandler', (): void => {
  let error: Error;
  let stack: string | undefined;
  let errorHandler: jest.Mocked<ErrorHandler>;
  let handler: SafeErrorHandler;
  let request: HttpRequest;
  let response: HttpResponse;

  beforeEach(async(): Promise<void> => {
    error = new NotFoundHttpError('not here');
    ({ stack } = error);

    errorHandler = {
      handleSafe: jest.fn().mockResolvedValue({ data: guardedStreamFrom('<html>fancy error</html>') }),
    } as any;

    request = {
      headers: {
        'content-type': 'text/plain',
      },
    } as any;

    response = {
      hasHeader: jest.fn(),
      getHeader: jest.fn(),
      setHeader: jest.fn(),
    } as any;

    handler = new SafeErrorHandler(errorHandler, true);
  });

  it('can handle everything.', async(): Promise<void> => {
    await expect(handler.canHandle({} as any)).resolves.toBeUndefined();
  });

  it('sends the request to the stored error handler.', async(): Promise<void> => {
    const promise = handler.handle({
      error,
      request,
      response,
    } as any);
    await expect(promise).resolves.toBeDefined();
    const result = await promise;
    await expect(readableToString(result.data!)).resolves.toBe('<html>fancy error</html>');
  });

  describe('where the wrapped error handler fails', (): void => {
    beforeEach(async(): Promise<void> => {
      errorHandler.handleSafe.mockRejectedValue(new Error('handler failed'));
    });

    describe('when the content-type header is not application/json', (): void => {
      it('creates a text representation of the error.', async(): Promise<void> => {
        const prom = handler.handle({
          error,
          request,
          response,
        } as any);
        await expect(prom).resolves.toBeDefined();
        const result = await prom;
        expect(result.statusCode).toBe(404);
        await expect(readableToString(result.data!)).resolves.toBe(`${stack}\n`);
      });

      it('concatenates name and message if there is no stack.', async(): Promise<void> => {
        delete error.stack;
        const prom = handler.handle({
          error,
          request,
          response,
        } as any);
        await expect(prom).resolves.toBeDefined();
        const result = await prom;
        expect(result.statusCode).toBe(404);
        await expect(readableToString(result.data!)).resolves.toBe(`NotFoundHttpError: not here\n`);
      });

      it('hides the stack trace if the option is disabled.', async(): Promise<void> => {
        handler = new SafeErrorHandler(errorHandler);
        const prom = handler.handle({
          error,
          request,
          response,
        } as any);
        await expect(prom).resolves.toBeDefined();
        const result = await prom;
        expect(result.statusCode).toBe(404);
        await expect(readableToString(result.data!)).resolves.toBe(`NotFoundHttpError: not here\n`);
      });
    });

    describe('when the content-type header is application/json', (): void => {
      beforeEach(async(): Promise<void> => {
        request.headers['content-type'] = APPLICATION_JSON;
      });

      it('creates a json representation of the error.', async(): Promise<void> => {
        const prom = handler.handle({
          error,
          request,
          response,
        } as any);
        await expect(prom).resolves.toBeDefined();
        const result = await prom;
        expect(result.statusCode).toBe(404);
        await expect(readJsonStream(result.data!)).resolves.toMatchObject({
          error: {
            code: 404,
            name: 'NotFoundHttpError',
            message: stack,
          },
        });
        expect(response.setHeader).toHaveBeenCalledTimes(1);
        expect(response.setHeader).toHaveBeenCalledWith('Content-Type', APPLICATION_JSON);
      });

      it('shows the message if there is no stack.', async(): Promise<void> => {
        delete error.stack;
        const prom = handler.handle({
          error,
          request,
          response,
        } as any);
        await expect(prom).resolves.toBeDefined();
        const result = await prom;
        expect(result.statusCode).toBe(404);
        await expect(readJsonStream(result.data!)).resolves.toMatchObject({
          error: {
            code: 404,
            name: 'NotFoundHttpError',
            message: 'not here',
          },
        });
        expect(response.setHeader).toHaveBeenCalledTimes(1);
        expect(response.setHeader).toHaveBeenCalledWith('Content-Type', APPLICATION_JSON);
      });

      it('uses the message if the stack trace option is disabled.', async(): Promise<void> => {
        handler = new SafeErrorHandler(errorHandler);
        const prom = handler.handle({
          error,
          request,
          response,
        } as any);
        await expect(prom).resolves.toBeDefined();
        const result = await prom;
        expect(result.statusCode).toBe(404);
        await expect(readJsonStream(result.data!)).resolves.toMatchObject({
          error: {
            code: 404,
            name: 'NotFoundHttpError',
            message: 'not here',
          },
        });
        expect(response.setHeader).toHaveBeenCalledTimes(1);
        expect(response.setHeader).toHaveBeenCalledWith('Content-Type', APPLICATION_JSON);
      });
    });
  });
});
