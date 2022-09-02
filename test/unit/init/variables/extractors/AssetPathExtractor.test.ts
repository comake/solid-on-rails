import { AssetPathExtractor } from '../../../../../src/init/variables/extractors/AssetPathExtractor';
import { PlaceholderPathResolver } from '../../../../../src/util/path/PlaceholderPathResolver';
import { joinFilePath } from '../../../../../src/util/PathUtil';

describe('An AssetPathExtractor', (): void => {
  let pathResolver: PlaceholderPathResolver;
  let extractor: AssetPathExtractor;

  beforeEach(async(): Promise<void> => {
    pathResolver = new PlaceholderPathResolver('@SoR:');
    extractor = new AssetPathExtractor('path', pathResolver);
  });

  it('resolves the asset path.', async(): Promise<void> => {
    await expect(extractor.handle({ path: '/var/data' })).resolves.toBe('/var/data');
  });

  it('errors if the path is not a string.', async(): Promise<void> => {
    await expect(extractor.handle({ path: 1234 })).rejects.toThrow('Invalid path argument');
  });

  it('converts paths containing the module path placeholder.', async(): Promise<void> => {
    await expect(extractor.handle({ path: '@SoR:config/file.json' }))
      .resolves.toEqual(joinFilePath(__dirname, '../../../../../config/file.json'));
  });

  it('defaults to the given path if none is provided.', async(): Promise<void> => {
    extractor = new AssetPathExtractor('path', pathResolver, '/root');
    await expect(extractor.handle({ otherPath: '/var/data' })).resolves.toBe('/root');
  });

  it('returns null if not default value or default is provided.', async(): Promise<void> => {
    extractor = new AssetPathExtractor('path', pathResolver);
    await expect(extractor.handle({ otherPath: '/var/data' })).resolves.toBeNull();
  });
});
