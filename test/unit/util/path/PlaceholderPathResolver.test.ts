import { PlaceholderPathResolver } from '../../../../src/util/path/PlaceholderPathResolver';
import { joinFilePath, getModuleRoot } from '../../../../src/util/PathUtil';

describe('A PlaceholderPathResolver', (): void => {
  const modulePathPlaceholder = '@sklAppServer:';
  let resolver: PlaceholderPathResolver;

  beforeEach(async(): Promise<void> => {
    resolver = new PlaceholderPathResolver(modulePathPlaceholder);
  });

  it('returns the module root for undefined paths.', (): void => {
    expect(resolver.resolveAssetPath()).toBe(getModuleRoot());
  });

  it('interprets paths relative to the module root when they start with the modulePathPlaceholder.', (): void => {
    expect(
      resolver.resolveAssetPath(`${modulePathPlaceholder}foo/bar`),
    ).toBe(joinFilePath(getModuleRoot(), '/foo/bar'));
  });

  it('handles ../ paths that start with the modulePathPlaceholder.', (): void => {
    expect(
      resolver.resolveAssetPath(`${modulePathPlaceholder}foo/bar/../baz`),
    ).toBe(joinFilePath(getModuleRoot(), '/foo/baz'));
  });

  it('leaves absolute paths as they are.', (): void => {
    expect(resolver.resolveAssetPath('/foo/bar/')).toBe('/foo/bar/');
  });

  it('handles other paths relative to the cwd.', (): void => {
    expect(resolver.resolveAssetPath('foo/bar/')).toBe(joinFilePath(process.cwd(), 'foo/bar/'));
  });

  it('handles other paths with ../.', (): void => {
    expect(resolver.resolveAssetPath('foo/bar/../baz')).toBe(joinFilePath(process.cwd(), 'foo/baz'));
  });
});
