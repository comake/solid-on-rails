import { resolveModulePath, absoluteFilePath } from '../PathUtil';
import type { PathResolver } from './PathResolver';

export class PlaceholderPathResolver implements PathResolver {
  private readonly modulePathPlaceholder;

  public constructor(modulePathPlaceholder: string) {
    this.modulePathPlaceholder = modulePathPlaceholder;
  }

  /**
   * Converts file path inputs into absolute paths.
   * Works similar to `absoluteFilePath` but paths that start with the `modulePathPlaceholder`
   * will be relative to the module directory instead of the cwd.
   */
  public resolveAssetPath(path?: string): string {
    if (!path) {
      return resolveModulePath('');
    }
    if (path.startsWith(this.modulePathPlaceholder)) {
      return resolveModulePath(path.slice(this.modulePathPlaceholder.length));
    }
    return absoluteFilePath(path);
  }
}
