import { RedirectingErrorHandler } from '../../../../../src/http/output/error/RedirectingErrorHandler';
import { BadRequestHttpError } from '../../../../../src/util/errors/BadRequestHttpError';
import { FoundHttpError } from '../../../../../src/util/errors/FoundHttpError';
import { NotImplementedHttpError } from '../../../../../src/util/errors/NotImplementedHttpError';

describe('A RedirectingErrorHandler', (): void => {
  const handler = new RedirectingErrorHandler();

  it('only accepts redirect errors.', async(): Promise<void> => {
    const unsupportedError = new BadRequestHttpError();
    await expect(handler.canHandle({ error: unsupportedError })).rejects.toThrow(NotImplementedHttpError);

    const supportedError = new FoundHttpError('http://test.com/foo/bar');
    await expect(handler.canHandle({ error: supportedError })).resolves.toBeUndefined();
  });

  it('creates redirect responses.', async(): Promise<void> => {
    const error = new FoundHttpError('http://test.com/foo/bar');
    const result = await handler.handle({ error });
    expect(result.statusCode).toBe(error.statusCode);
  });
});
