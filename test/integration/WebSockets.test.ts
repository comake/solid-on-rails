/* eslint-disable @typescript-eslint/naming-convention */
import { WebSocket } from 'ws';
import { WebSocketHandler } from '../../src/http/handler/WebSocketHandler';
import type { WebSocketHandlerInput } from '../../src/http/handler/WebSocketHandler';
import type { App } from '../../src/init/App';
import { getPort } from '../util/Util';
import {
  getDefaultVariables,
  getTestConfigPath,
  instantiateFromConfig,
} from './Config';

const port = getPort('WebSockets');
const baseUrl = `http://localhost:${port}`;
const message = 'Hello there!';

class SimpleWebSocketHandler extends WebSocketHandler {
  public async handle(input: WebSocketHandlerInput): Promise<void> {
    input.webSocket.send(message);
  }
}

describe('A http server with websocket endpoint handlers', (): void => {
  let app: App;

  beforeAll(async(): Promise<void> => {
    const instances = await instantiateFromConfig(
      'urn:solid-on-rails:test:Instances',
      getTestConfigPath('websocket-server.json'),
      {
        ...getDefaultVariables(port, baseUrl),
        'urn:solid-on-rails:default:ExampleWebSocketHandler': new SimpleWebSocketHandler(),
      },
    ) as Record<string, any>;
    ({ app } = instances);
    await app.start();
  });

  afterAll(async(): Promise<void> => {
    await app.stop();
  });

  it('handles websocket connections.', async(): Promise<void> => {
    let parsedMessage: string | undefined;
    await new Promise<void>((resolve, reject): void => {
      const webSocket = new WebSocket(`ws://localhost:${port}/websocket-path`);
      webSocket.on('message', (data): void => {
        if (typeof data === 'string') {
          parsedMessage = data;
        } else if (data instanceof Buffer) {
          parsedMessage = data.toString();
        }
        webSocket.close();
        resolve();
      });
      webSocket.on('error', (error): void => {
        reject(error);
      });
    });

    expect(parsedMessage).toEqual(message);
  });
});
