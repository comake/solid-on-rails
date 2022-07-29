import { createResponse } from 'node-mocks-http';
import type { HttpResponse } from '../../../../src/http/HttpResponse';
import type { ParsedRequestHandlerInput } from '../../../../src/server/ParsedRequestHandler';
import { RouteHandler } from '../../../../src/server/routing/RouteHandler';
import type { Route } from '../../../../src/server/routing/RouteHandler';
import type { AsyncHandler } from '../../../../src/util/handlers/AsyncHandler';
import { guardedStreamFrom } from '../../../../src/util/StreamUtil';
import { StaticAsyncHandler } from '../../../util/StaticAsyncHandler';

describe('A RouteHandler', (): void => {
  let route: Route;
  let subHandler: AsyncHandler<any, any>;
  let genericResponse: HttpResponse;
  let genericInput: ParsedRequestHandlerInput;

  beforeEach((): void => {
    subHandler = new StaticAsyncHandler(true, 'response');
    route = {
      path: '/test',
      method: 'GET',
    };

    genericResponse = createResponse() as HttpResponse;
    genericInput = {
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
    const handler = new RouteHandler(route, subHandler);
    await expect(handler.handle(genericInput)).resolves.toBe('response');
  });

  it('throws an error when the request method does not match the route method.', async(): Promise<void> => {
    route.method = 'POST';
    const handler = new RouteHandler(route, subHandler);
    await expect(handler.canHandle(genericInput)).rejects.toThrow('GET is not allowed.');
  });

  it('throws an error when the subdomain of the request does not match the route\'s subdomain string.',
    async(): Promise<void> => {
      genericInput.request.url = new URL('https://app.example.com/test');
      route.subdomain = 'api';
      const handler = new RouteHandler(route, subHandler);
      await expect(handler.canHandle(genericInput)).rejects.toThrow('Cannot handle subdomain of app.example.com');
    });

  it(`throws an error when the subdomain of the request does not match any value
    in the route's subdomain array of strings.`,
  async(): Promise<void> => {
    genericInput.request.url = new URL('https://app.example.com/test');
    route.subdomain = [ 'api', 'web' ];
    const handler = new RouteHandler(route, subHandler);
    await expect(handler.canHandle(genericInput)).rejects.toThrow('Cannot handle subdomain of app.example.com');
  });

  it('throws an error when the subdomain of the request does not match the route\'s subdomain regex.',
    async(): Promise<void> => {
      genericInput.request.url = new URL('https://app.example.com/test');
      route.subdomain = /^api|api\.sandbox/u;
      const handler = new RouteHandler(route, subHandler);
      await expect(handler.canHandle(genericInput)).rejects.toThrow('Cannot handle subdomain of app.example.com');
    });

  it('throws an error when the request has no subdomain and the route specifies one.',
    async(): Promise<void> => {
      genericInput.request.url = new URL('https://example.com/test');
      route.subdomain = 'api';
      const handler = new RouteHandler(route, subHandler);
      await expect(handler.canHandle(genericInput)).rejects.toThrow('Cannot handle subdomain of example.com');
    });

  it('throws an error when the request has a subdomain and the route does not specify one.',
    async(): Promise<void> => {
      genericInput.request.url = new URL('https://app.example.com/test');
      const handler = new RouteHandler(route, subHandler);
      await expect(handler.canHandle(genericInput)).rejects.toThrow('Cannot handle subdomain of app.example.com');
    });

  it('throws an error when the request\'s path does not match the route\'s path matcher.',
    async(): Promise<void> => {
      genericInput.request.url = new URL('https://example.com/nottest');
      const handler = new RouteHandler(route, subHandler);
      await expect(handler.canHandle(genericInput)).rejects.toThrow('Cannot handle route /nottest');
    });

  it('throws an error if the sub handler cannot handle.', async(): Promise<void> => {
    subHandler = new StaticAsyncHandler(false, undefined);
    const handler = new RouteHandler(route, subHandler);
    await expect(handler.canHandle(genericInput)).rejects.toThrow('Not supported');
  });
});
