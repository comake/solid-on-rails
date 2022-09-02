import { promises as fsPromises } from 'fs';

import {
  joinFilePath,
  absoluteFilePath,
  ensureTrailingSlash,
  toCanonicalUriPath,
  getModuleRoot,
  resolveModulePath,
  readPackageJson,
} from '../../../src/util/PathUtil';

describe('PathUtil', (): void => {
  describe('#joinFilePath', (): void => {
    it('joins POSIX paths.', (): void => {
      expect(joinFilePath('/foo/bar/', '..', '/baz')).toBe('/foo/baz');
    });

    it('joins Windows paths.', (): void => {
      expect(joinFilePath('c:\\foo\\bar\\', '..', '/baz')).toBe(`c:/foo/baz`);
    });
  });

  describe('#absoluteFilePath', (): void => {
    it('does not change absolute posix paths.', (): void => {
      expect(absoluteFilePath('/foo/bar/')).toBe('/foo/bar/');
    });

    it('converts absolute win32 paths to posix paths.', (): void => {
      expect(absoluteFilePath('C:\\foo\\bar')).toBe('C:/foo/bar');
    });

    it('makes relative paths absolute.', (): void => {
      expect(absoluteFilePath('foo/bar/')).toEqual(joinFilePath(process.cwd(), 'foo/bar/'));
    });
  });

  describe('#ensureTrailingSlash', (): void => {
    it('makes sure there is always exactly 1 slash.', (): void => {
      expect(ensureTrailingSlash('http://test.com')).toBe('http://test.com/');
      expect(ensureTrailingSlash('http://test.com/')).toBe('http://test.com/');
      expect(ensureTrailingSlash('http://test.com//')).toBe('http://test.com/');
      expect(ensureTrailingSlash('http://test.com///')).toBe('http://test.com/');
    });
  });

  describe('#toCanonicalUriPath', (): void => {
    it('encodes only the necessary parts.', (): void => {
      expect(toCanonicalUriPath('/a%20path&/name')).toBe('/a%20path%26/name');
    });

    it('leaves the query string untouched.', (): void => {
      expect(toCanonicalUriPath('/a%20path&/name?abc=def&xyz')).toBe('/a%20path%26/name?abc=def&xyz');
    });
  });

  describe('#getModuleRoot', (): void => {
    it('returns the root folder of the module.', async(): Promise<void> => {
      // Note that this test only makes sense as long as the dist folder is on the same level as the src folder
      const root = getModuleRoot();
      const packageJson = joinFilePath(root, 'package.json');
      await expect(fsPromises.access(packageJson)).resolves.toBeUndefined();
    });
  });

  describe('#resolveModulePath', (): void => {
    it('transforms the empty input into the module root path.', (): void => {
      expect(resolveModulePath()).toBe(getModuleRoot());
    });

    it('prefixes a path with the module root path.', (): void => {
      expect(resolveModulePath('foo/bar.json')).toBe(`${getModuleRoot()}foo/bar.json`);
    });
  });

  describe('#readPackageJson', (): void => {
    it('returns the contents of the package.json file at the root of the module.', async(): Promise<void> => {
      const result = await readPackageJson();
      expect(result).toMatchObject({
        name: '@comake/solid-on-rails',
      });
    });
  });
});
