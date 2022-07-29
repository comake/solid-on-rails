import { EventEmitter } from 'events';
import { PassThrough } from 'stream';
import type { MockResponse } from 'node-mocks-http';
import { createResponse } from 'node-mocks-http';
import { BasicResponseWriter } from '../../../../src/http/output/BasicResponseWriter';
import type { ResponseDescription } from '../../../../src/http/output/response/ResponseDescription';
import { guardedStreamFrom } from '../../../../src/util/StreamUtil';

describe('A BasicResponseWriter', (): void => {
  let writer: BasicResponseWriter;
  let response: MockResponse<any>;
  let result: ResponseDescription;

  beforeEach(async(): Promise<void> => {
    response = createResponse({ eventEmitter: EventEmitter });
    result = { statusCode: 201 };
    writer = new BasicResponseWriter();
  });

  it('responds with the status code of the ResponseDescription.', async(): Promise<void> => {
    await writer.handle({ response, result });
    expect(response._isEndCalled()).toBeTruthy();
    expect(response._getStatusCode()).toBe(201);
  });

  it('responds with a body if the description has a body.', async(): Promise<void> => {
    const data = guardedStreamFrom([ '<http://test.com/s> <http://test.com/p> <http://test.com/o>.' ]);
    result = { statusCode: 201, data };

    const end = new Promise<void>((resolve): void => {
      response.on('end', (): void => {
        expect(response._isEndCalled()).toBeTruthy();
        expect(response._getStatusCode()).toBe(201);
        expect(response._getData()).toBe('<http://test.com/s> <http://test.com/p> <http://test.com/o>.');
        resolve();
      });
    });

    await writer.handle({ response, result });
    await end;
  });

  it('can handle the data stream erroring.', async(): Promise<void> => {
    const data = guardedStreamFrom([]);
    data.read = (): any => {
      data.emit('error', new Error('bad data!'));
      return null;
    };
    result = { statusCode: 201, data };

    response = new PassThrough();
    response.writeHead = jest.fn();

    const end = new Promise<void>((resolve): void => {
      response.on('error', (error: Error): void => {
        expect(error).toEqual(new Error('bad data!'));
        resolve();
      });
    });

    await expect(writer.handle({ response, result })).resolves.toBeUndefined();
    await end;
  });
});
