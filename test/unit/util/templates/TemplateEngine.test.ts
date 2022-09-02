/* eslint-disable @typescript-eslint/naming-convention */
import { PlaceholderPathResolver } from '../../../../src/util/path/PlaceholderPathResolver';
import { getTemplateFilePath, readTemplate } from '../../../../src/util/templates/TemplateEngine';
import { mockFileSystem } from '../../../util/Util';

jest.mock('fs');
const pathResolver = new PlaceholderPathResolver('@SoR:');

describe('TemplateEngine', (): void => {
  describe('#getTemplateFilePath', (): void => {
    const templateFile = 'template.xyz';
    const templatePath = 'other';

    beforeEach(async(): Promise<void> => {
      const { data } = mockFileSystem(pathResolver.resolveAssetPath(''));
      Object.assign(data, {
        'template.xyz': '{{template}}',
        other: {
          'template.xyz': '{{other}}',
        },
      });
    });

    it('returns the undefined when no template is provided.', async(): Promise<void> => {
      expect(getTemplateFilePath(pathResolver)).toBeUndefined();
    });

    it('returns the input if it was a filename.', async(): Promise<void> => {
      expect(getTemplateFilePath(pathResolver, templateFile)).toBe(pathResolver.resolveAssetPath(templateFile));
    });

    it('returns undefined for options with a string template.', async(): Promise<void> => {
      expect(getTemplateFilePath(pathResolver, { templateString: 'abc' })).toBeUndefined();
    });

    it('accepts options with a filename.', async(): Promise<void> => {
      expect(getTemplateFilePath(pathResolver, { templateFile })).toBe(pathResolver.resolveAssetPath(templateFile));
    });

    it('accepts options with a filename and a path.', async(): Promise<void> => {
      expect(
        getTemplateFilePath(pathResolver, { templateFile, templatePath }),
      ).toBe(pathResolver.resolveAssetPath('other/template.xyz'));
    });
  });

  describe('#readTemplate', (): void => {
    const templateFile = 'template.xyz';
    const templatePath = 'other';

    beforeEach(async(): Promise<void> => {
      const { data } = mockFileSystem(pathResolver.resolveAssetPath(''));
      Object.assign(data, {
        'template.xyz': '{{template}}',
        other: {
          'template.xyz': '{{other}}',
        },
      });
    });

    it('returns the empty string when no template is provided.', async(): Promise<void> => {
      await expect(readTemplate(pathResolver)).resolves.toBe('');
    });

    it('accepts a filename.', async(): Promise<void> => {
      await expect(readTemplate(pathResolver, templateFile)).resolves.toBe('{{template}}');
    });

    it('accepts options with a string template.', async(): Promise<void> => {
      await expect(readTemplate(pathResolver, { templateString: 'abc' })).resolves.toBe('abc');
    });

    it('accepts options with a filename.', async(): Promise<void> => {
      await expect(readTemplate(pathResolver, { templateFile })).resolves.toBe('{{template}}');
    });

    it('accepts options with a filename and a path.', async(): Promise<void> => {
      await expect(readTemplate(pathResolver, { templateFile, templatePath })).resolves.toBe('{{other}}');
    });
  });
});
