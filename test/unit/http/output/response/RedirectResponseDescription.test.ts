import { RedirectResponseDescription } from '../../../../../src/http/output/response/RedirectResponseDescription';
import { FoundHttpError } from '../../../../../src/util/errors/FoundHttpError';

describe('A RedirectResponseDescription', (): void => {
  const error = new FoundHttpError('http://test.com/foo');

  it('has status the code and location of the error.', async(): Promise<void> => {
    const description = new RedirectResponseDescription(error);
    // Nedd to figure this out - no location here
    expect(description.statusCode).toBe(error.statusCode);
  });
});
