/**
 * Resolves relative paths to absolute paths
 */
export interface PathResolver {
  resolveAssetPath: (path?: string) => string;
}
