import { types } from 'util';

/**
 * Checks if the input is an {@link Error}.
 */
export function isError(error: any): error is Error {
  return types.isNativeError(error) ||
    (error &&
    typeof error.name === 'string' &&
    typeof error.message === 'string' &&
    (typeof error.stack === 'undefined' || typeof error.stack === 'string'));
}

/**
 * Asserts that the input is a native error.
 * If not the input will be re-thrown.
 */
export function assertError(error: unknown): asserts error is Error {
  if (!isError(error)) {
    throw error;
  }
}

export function createErrorMessage(error: unknown): string {
  return isError(error) ? error.message : `Unknown error: ${error}`;
}

/**
 * Throws a new error that provides additional information through the extra message.
 * Also appends the stack trace to the message.
 * This is needed for errors that are thrown before the logger is created as we can't log those the standard way.
 */
export function resolveError(message: string, error: unknown): never {
  let errorMessage = `${message}\nCause: ${createErrorMessage(error)}\n`;
  if (isError(error)) {
    errorMessage += `${error.stack}\n`;
  }
  throw new Error(errorMessage);
}
