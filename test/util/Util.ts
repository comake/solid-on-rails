const portNames = [
  // Integration
  'Conditions',
  'ContentNegotiation',
  'ExpiringDataCleanup',
  'FileBackendEncodedSlashHandling',
  'GlobalQuota',
  'Identity',
  'LpdHandlerWithAuth',
  'LpdHandlerWithoutAuth',
  'Middleware',
  'N3Patch',
  'PermissionTable',
  'RedisLocker',
  'RestrictedIdentity',
  'SeedingPods',
  'ServerFetch',
  'SetupMemory',
  'SparqlStorage',
  'Subdomains',
  // Unit
  'BaseHttpServerFactory',
] as const;

export function getPort(name: typeof portNames[number]): number {
  const idx = portNames.indexOf(name);
  // Just in case something doesn't listen to the typings
  if (idx < 0) {
    throw new Error(`Unknown port name ${name}`);
  }
  return 6000 + idx;
}

/**
 * This is needed when you want to wait for all promises to resolve.
 * Also works when using jest.useFakeTimers().
 * For more details see the links below
 *  - https://github.com/facebook/jest/issues/2157
 *  - https://stackoverflow.com/questions/52177631/jest-timer-and-promise-dont-work-well-settimeout-and-async-function
 */
export async function flushPromises(): Promise<void> {
  return new Promise(jest.requireActual('timers').setImmediate);
}
