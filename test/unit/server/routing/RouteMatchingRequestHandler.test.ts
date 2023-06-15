import { createResponse } from 'node-mocks-http';
import type { HttpResponse } from '../../../../src/http/HttpResponse';
import type { ParameterExtractor } from '../../../../src/http/input/params/ParameterExtractor';
import type { ParsedRequestHandlerInput } from '../../../../src/server/ParsedRequestHandler';
import type { Route } from '../../../../src/server/routing/RouteMatchingRequestHandler';
import { RouteMatchingRequestHandler } from '../../../../src/server/routing/RouteMatchingRequestHandler';
import type { AsyncHandler } from '../../../../src/util/handlers/AsyncHandler';
import { guardedStreamFrom } from '../../../../src/util/StreamUtil';
import { StaticAsyncHandler } from '../../../util/StaticAsyncHandler';

describe('A RouteHandler', (): void => {
  let route: Route;
  let subHandler: AsyncHandler<any, any>;
  let genericResponse: HttpResponse;
  let input: ParsedRequestHandlerInput;
  let parameterExtractor: ParameterExtractor;

  beforeEach((): void => {
    subHandler = new StaticAsyncHandler(true, 'response');
    route = {
      path: '/test',
      method: 'GET',
    };
    parameterExtractor = { handle: jest.fn().mockResolvedValue({}) } as any;
    genericResponse = createResponse() as HttpResponse;
    input = {
      request: {
        method: 'GET',
        url: new URL('https://example.com/test'),
        headers: {},
        data: guardedStreamFrom('data'),
      },
      response: genericResponse,
    };
  });

  it('calls the sub handler when handle is called.', async(): Promise<void> => {
    const handler = new RouteMatchingRequestHandler(route, subHandler, parameterExtractor);
    await expect(handler.handle(input)).resolves.toBe('response');
  });

  it('can handle when the routes subdomain is * and the request has any subdomain.',
    async(): Promise<void> => {
      input.request.url = new URL('https://app.example.com/test');
      route.subdomain = '*';
      const handler = new RouteMatchingRequestHandler(route, subHandler, parameterExtractor);
      await expect(handler.canHandle(input)).resolves.toBeUndefined();
    });

  it('throws an error when the request method does not match the route method.', async(): Promise<void> => {
    route.method = 'POST';
    const handler = new RouteMatchingRequestHandler(route, subHandler, parameterExtractor);
    await expect(handler.canHandle(input)).rejects.toThrow('GET is not allowed.');
  });

  it('throws an error when the subdomain of the request does not match the route\'s subdomain string.',
    async(): Promise<void> => {
      input.request.url = new URL('https://app.example.com/test');
      route.subdomain = 'api';
      const handler = new RouteMatchingRequestHandler(route, subHandler, parameterExtractor);
      await expect(handler.canHandle(input)).rejects.toThrow('Cannot handle subdomain of app.example.com');
    });

  it(`throws an error when the subdomain of the request does not match any value
    in the route's subdomain array of strings.`,
  async(): Promise<void> => {
    input.request.url = new URL('https://app.example.com/test');
    route.subdomain = [ 'api', 'web' ];
    const handler = new RouteMatchingRequestHandler(route, subHandler, parameterExtractor);
    await expect(handler.canHandle(input)).rejects.toThrow('Cannot handle subdomain of app.example.com');
  });

  it('throws an error when the request has no subdomain and the route specifies one.',
    async(): Promise<void> => {
      input.request.url = new URL('https://example.com/test');
      route.subdomain = 'api';
      const handler = new RouteMatchingRequestHandler(route, subHandler, parameterExtractor);
      await expect(handler.canHandle(input)).rejects.toThrow('Cannot handle subdomain of example.com');
    });

  it('throws an error when the request has a subdomain and the route does not specify one.',
    async(): Promise<void> => {
      input.request.url = new URL('https://app.example.com/test');
      const handler = new RouteMatchingRequestHandler(route, subHandler, parameterExtractor);
      await expect(handler.canHandle(input)).rejects.toThrow('Cannot handle subdomain of app.example.com');
    });

  it('throws an error when the request\'s path does not match the route\'s path matcher.',
    async(): Promise<void> => {
      input.request.url = new URL('https://example.com/nottest');
      const handler = new RouteMatchingRequestHandler(route, subHandler, parameterExtractor);
      await expect(handler.canHandle(input)).rejects.toThrow('Cannot handle route /nottest');
    });

  it('parses the params and adds them to the input.', async(): Promise<void> => {
    subHandler = { handle: jest.fn().mockReturnValue('response') } as any;
    route.path = '/users/:id';
    input.request.url = new URL('https://example.com/users/1');
    (parameterExtractor.handle as jest.Mock).mockResolvedValueOnce({ id: '1' });
    const handler = new RouteMatchingRequestHandler(route, subHandler, parameterExtractor);
    await expect(handler.handle(input)).resolves.toBe('response');
    expect(subHandler.handle).toHaveBeenCalledTimes(1);
    expect(subHandler.handle).toHaveBeenCalledWith({
      ...input,
      params: { id: '1' },
    });
  });

  it('defaults the params to an empty object.', async(): Promise<void> => {
    subHandler = { handle: jest.fn().mockReturnValue('response') } as any;
    route.path = '/notusers';
    input.request.url = new URL('https://example.com/users/1');
    const handler = new RouteMatchingRequestHandler(route, subHandler, parameterExtractor);
    await expect(handler.handle(input)).resolves.toBe('response');
    expect(subHandler.handle).toHaveBeenCalledTimes(1);
    expect(subHandler.handle).toHaveBeenCalledWith({
      ...input,
      params: {},
    });
  });
});
