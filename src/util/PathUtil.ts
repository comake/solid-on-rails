import { posix, win32 } from 'path';
import { readJson } from 'fs-extra';
import urljoin from 'url-join';

/**
 * Changes a potential Windows path into a POSIX path.
 *
 * @param path - Path to check (POSIX or Windows).
 * @returns The potentially changed path (POSIX).
 */
function windowsToPosixPath(path: string): string {
  return path.replace(/\\+/gu, '/');
}

/**
 * Adds the paths to the base path.
 *
 * @param basePath - The base path (POSIX or Windows).
 * @param paths - Subpaths to attach (POSIX).
 * @returns The potentially changed path (POSIX).
 */
export function joinFilePath(basePath: string, ...paths: string[]): string {
  return posix.join(windowsToPosixPath(basePath), ...paths);
}

/**
 * Resolves a path to its absolute form.
 * Absolute inputs will not be changed (except changing Windows to POSIX).
 * Relative inputs will be interpreted relative to process.cwd().
 *
 * @param path - Path to check (POSIX or Windows).
 * @returns The potentially changed path (POSIX).
 */
export function absoluteFilePath(path: string): string {
  if (posix.isAbsolute(path)) {
    return path;
  }
  if (win32.isAbsolute(path)) {
    return windowsToPosixPath(path);
  }

  return joinFilePath(process.cwd(), path);
}

/**
 * Makes sure the input path has exactly 1 slash at the end.
 * Multiple slashes will get merged into one.
 * If there is no slash it will be added.
 *
 * @param path - Path to check.
 *
 * @returns The potentially changed path.
 */
export function ensureTrailingSlash(path: string): string {
  return path.replace(/\/*$/u, '/');
}

/**
 * Performs a transformation on the path components of a URI,
 * preserving but normalizing path delimiters and their escaped forms.
 */
function transformPathComponents(path: string, transform: (part: string) => string): string {
  const [ , base, queryString ] = /^([^?]*)(.*)$/u.exec(path)!;
  const transformed = base
    // We split on actual URI path component delimiters (slash and backslash),
    // but also on things that could be wrongly interpreted as component delimiters,
    // such that they cannot be transformed incorrectly.
    // We thus ensure that encoded slashes (%2F) and backslashes (%5C) are preserved,
    // since they would become _actual_ delimiters if accidentally decoded.
    // Additionally, we need to preserve any encoded percent signs (%25)
    // that precede them, because these might change their interpretation as well.
    .split(/(\/|\\|%(?:25)*(?:2f|5c))/ui)
    // Even parts map to components that need to be transformed,
    // odd parts to (possibly escaped) delimiters that need to be normalized.
    .map((part, index): string =>
      index % 2 === 0 ? transform(part) : part.toUpperCase())
    .join('');
  return !queryString ? transformed : `${transformed}${queryString}`;
}

/**
 * Converts a URI path to the canonical version by splitting on slashes,
 * decoding any percent-based encodings, and then encoding any special characters.
 * This function is used to clean unwanted characters in the components of
 * the provided path.
 *
 * @param path - The path to convert to its canonical URI path form.
 * @returns The canonical URI path form of the provided path.
 */
export function toCanonicalUriPath(path: string): string {
  return transformPathComponents(path, (part): string =>
    encodeURIComponent(decodeURIComponent(part)));
}

/**
 * Returns the folder corresponding to the root of the Community Solid Server module
 */
export function getModuleRoot(): string {
  return joinFilePath(__dirname, '../../');
}

/**
 * Creates an absolute path starting from the `@solid/community-server` module root.
 */
export function resolveModulePath(relativePath = ''): string {
  return joinFilePath(getModuleRoot(), relativePath);
}

/**
 * Reads the project package.json and returns it.
 */
export async function readPackageJson(): Promise<Record<string, any>> {
  return readJson(resolveModulePath('package.json'));
}

/**
 * Concatenates all the given strings into a normalized URL.
 * Will place slashes between input strings if necessary.
 */
export const joinUrl = urljoin;
