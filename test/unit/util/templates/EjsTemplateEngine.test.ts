import type { PathResolver } from '../../../../src/util/path/PathResolver';
import { EjsTemplateEngine } from '../../../../src/util/templates/EjsTemplateEngine';

jest.mock('../../../../src/util/templates/TemplateEngine', (): any => ({
  getTemplateFilePath: jest.fn((): string => `filename`),
  readTemplate: jest.fn(async(pathResolver, { templateString }): Promise<string> => `${templateString}: <%= detail %>`),
}));

describe('A EjsTemplateEngine', (): void => {
  const defaultTemplate = { templateString: 'xyz' };
  const contents = { detail: 'a&b' };
  let templateEngine: EjsTemplateEngine;
  const pathResolver: jest.Mocked<PathResolver> = {} as any;

  beforeEach((): void => {
    templateEngine = new EjsTemplateEngine(pathResolver, defaultTemplate);
  });

  it('uses the default template when no template was passed.', async(): Promise<void> => {
    await expect(templateEngine.render(contents)).resolves.toBe('xyz: a&amp;b');
  });

  it('uses the passed template.', async(): Promise<void> => {
    await expect(templateEngine.render(contents, { templateString: 'my' })).resolves.toBe('my: a&amp;b');
  });
});
