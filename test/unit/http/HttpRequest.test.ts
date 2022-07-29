import { isHttpRequest } from '../../../src/http/HttpRequest';

describe('HttpRequest', (): void => {
  describe('#isHttpRequest', (): void => {
    it('can identify HttpRequests.', async(): Promise<void> => {
      expect(isHttpRequest({})).toBe(false);
      expect(isHttpRequest({ socket: {}, method: 'GET', url: '/url' })).toBe(true);
    });
  });
});
