/**
 * Splits a string by comma.
 *
 * @param input - String instance to split.
 *
 * @returns A String array containining the split parts.
 */
export function splitCommaSeparated(input: string): string[] {
  return input.split(/\s*,\s*/u);
}
