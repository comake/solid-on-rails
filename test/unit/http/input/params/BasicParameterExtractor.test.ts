/* eslint-disable @typescript-eslint/naming-convention */
import type { Key } from 'path-to-regexp';
import { pathToRegexp } from 'path-to-regexp';
import { BasicParameterExtractor } from '../../../../../src/http/input/params/BasicParameterExtractor';
import { guardedStreamFrom } from '../../../../../src/util/StreamUtil';

describe('A BasicParameterExtractor', (): void => {
  let extractor: BasicParameterExtractor;
  const headers = {
    'content-type': 'application/json',
  };

  beforeEach(async(): Promise<void> => {
    extractor = new BasicParameterExtractor();
  });

  it('can handle any input.', async(): Promise<void> => {
    await expect(extractor.canHandle({} as any)).resolves.toBeUndefined();
  });

  it('returns an object.', async(): Promise<void> => {
    const request = { url: new URL('https://example.com/path'), method: 'GET', headers } as any;
    const pathKeys: Key[] = [];
    const pathRegex = pathToRegexp('/path', pathKeys);
    await expect(extractor.handle({ request, pathRegex, pathKeys })).resolves.toEqual({});
  });

  it('returns parameters from the path pattern.', async(): Promise<void> => {
    const request = { url: new URL('https://example.com/path/id-value'), method: 'GET', headers } as any;
    const pathKeys: Key[] = [];
    const pathRegex = pathToRegexp('/path/:id', pathKeys);
    await expect(extractor.handle({ request, pathRegex, pathKeys })).resolves.toEqual({
      id: 'id-value',
    });
  });

  it('returns parameters from the query string.', async(): Promise<void> => {
    const request = { url: new URL('https://example.com/path?foo=a'), method: 'GET', headers } as any;
    const pathKeys: Key[] = [];
    const pathRegex = pathToRegexp('/path', pathKeys);
    await expect(extractor.handle({ request, pathRegex, pathKeys })).resolves.toEqual({
      foo: 'a',
    });
  });

  it('returns parameters from the body if the content-type header is "application/json" and method supports a body.',
    async(): Promise<void> => {
      const data = { foo: 'a' };
      const dataStream = guardedStreamFrom(JSON.stringify(data));
      const request = {
        url: new URL('https://example.com/path'),
        method: 'POST',
        data: dataStream,
        headers,
      } as any;
      const pathKeys: Key[] = [];
      const pathRegex = pathToRegexp('/path', pathKeys);
      await expect(extractor.handle({ request, pathRegex, pathKeys })).resolves.toEqual({
        foo: 'a',
      });
    });

  it('does not return parameters from the body if the content-type header is not "application/json".',
    async(): Promise<void> => {
      const data = { foo: 'a' };
      const dataStream = guardedStreamFrom(JSON.stringify(data));
      const request = {
        url: new URL('https://example.com/path'),
        method: 'POST',
        data: dataStream,
        headers: {
          'content-type': 'appliation/octet-stream',
        },
      } as any;
      const pathKeys: Key[] = [];
      const pathRegex = pathToRegexp('/path', pathKeys);
      await expect(extractor.handle({ request, pathRegex, pathKeys })).resolves.toEqual({});
    });
});
