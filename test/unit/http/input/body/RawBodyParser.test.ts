/* eslint-disable @typescript-eslint/naming-convention */
import arrayifyStream from 'arrayify-stream';
import type { HttpRequest } from '../../../../../src/http/HttpRequest';
import type { BodyParserArgs } from '../../../../../src/http/input/body/BodyParser';
import { RawBodyParser } from '../../../../../src/http/input/body/RawBodyParser';
import { guardedStreamFrom } from '../../../../../src/util/StreamUtil';

describe('A RawBodyparser', (): void => {
  const bodyParser = new RawBodyParser();
  let input: BodyParserArgs;

  beforeEach(async(): Promise<void> => {
    input = { request: { headers: {}} as HttpRequest };
  });

  it('accepts all input.', async(): Promise<void> => {
    await expect(bodyParser.canHandle({} as any)).resolves.toBeUndefined();
  });

  it('returns empty output if there is no content length or transfer encoding.', async(): Promise<void> => {
    input.request = guardedStreamFrom([ 'data' ]) as HttpRequest;
    input.request.headers = {};
    const result = await bodyParser.handle(input);
    await expect(arrayifyStream(result)).resolves.toEqual([]);
  });

  // https://github.com/CommunitySolidServer/CommunitySolidServer/issues/498
  it('returns empty output if the content length is 0 and there is no content type.', async(): Promise<void> => {
    input.request = guardedStreamFrom([ 'data' ]) as HttpRequest;
    input.request.headers = { 'content-length': '0' };
    const result = await bodyParser.handle(input);
    await expect(arrayifyStream(result)).resolves.toEqual([]);
  });

  it('errors when a content length is specified without content type.', async(): Promise<void> => {
    input.request = guardedStreamFrom([ 'abc' ]) as HttpRequest;
    input.request.headers = { 'content-length': '1' };
    await expect(bodyParser.handle(input)).rejects
      .toThrow('HTTP request body was passed without a Content-Type header');
  });

  it('errors when a transfer encoding is specified without content type.', async(): Promise<void> => {
    input.request = guardedStreamFrom([ 'abc' ]) as HttpRequest;
    input.request.headers = { 'transfer-encoding': 'chunked' };
    await expect(bodyParser.handle(input)).rejects
      .toThrow('HTTP request body was passed without a Content-Type header');
  });

  it('returns a stream if there is empty data.', async(): Promise<void> => {
    input.request = guardedStreamFrom([]) as HttpRequest;
    input.request.headers = { 'content-length': '0', 'content-type': 'text/turtle' };
    const result = await bodyParser.handle(input);
    expect(result).toEqual(input.request);
    await expect(arrayifyStream(result)).resolves.toEqual([]);
  });

  it('returns a stream if there is non-empty data.', async(): Promise<void> => {
    input.request = guardedStreamFrom([ '<http://test.com/s> <http://test.com/p> <http://test.com/o>.' ]) as HttpRequest;
    input.request.headers = { 'transfer-encoding': 'chunked', 'content-type': 'text/turtle' };
    const result = await bodyParser.handle(input);
    expect(result).toEqual(input.request);
    await expect(arrayifyStream(result)).resolves.toEqual(
      [ '<http://test.com/s> <http://test.com/p> <http://test.com/o>.' ],
    );
  });
});
