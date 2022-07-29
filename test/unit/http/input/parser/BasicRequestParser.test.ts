import type { HttpRequest } from '../../../../../src/http/HttpRequest';
import type { BodyParser } from '../../../../../src/http/input/body/BodyParser';
import { BasicRequestParser } from '../../../../../src/http/input/parser/BasicRequestParser';
import type { UrlExtractor } from '../../../../../src/http/input/url/UrlExtractor';
import { StaticAsyncHandler } from '../../../../util/StaticAsyncHandler';

describe('A BasicRequestParser', (): void => {
  const headers: HttpRequest['headers'] = {};
  const url = new URL('https://example.com/target');
  let urlExtractor: UrlExtractor;
  let bodyParser: BodyParser;
  let requestParser: BasicRequestParser;

  beforeEach(async(): Promise<void> => {
    urlExtractor = new StaticAsyncHandler(true, url);
    bodyParser = new StaticAsyncHandler(true, 'body' as any);
    requestParser = new BasicRequestParser({ urlExtractor, bodyParser });
  });

  it('does not handle requests without a url.', async(): Promise<void> => {
    await expect(requestParser.canHandle({ method: 'GET', headers } as any))
      .rejects.toThrow('Cannot handle request without a url');
  });

  it('does not handle requests without a method.', async(): Promise<void> => {
    await expect(requestParser.canHandle({ url: 'url', headers } as any))
      .rejects.toThrow('Cannot handle request without a method');
  });

  it('can handle a properly formatted request.', async(): Promise<void> => {
    await expect(requestParser.canHandle({ url: 'url', method: 'GET', headers } as any))
      .resolves.toBeUndefined();
  });

  it('returns a ParsedRequest object.', async(): Promise<void> => {
    await expect(requestParser.handle({ url: 'url', method: 'GET', headers } as any)).resolves.toEqual({
      method: 'GET',
      url,
      headers: {},
      data: 'body',
    });
  });
});
