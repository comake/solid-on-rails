import type { HttpErrorOptions } from './HttpError';
import { generateHttpErrorClass } from './HttpError';

// eslint-disable-next-line @typescript-eslint/naming-convention
const BaseHttpError = generateHttpErrorClass(405, 'MethodNotAllowedHttpError');

/**
 * An error thrown when data was found for the requested identifier, but is not supported by the target resource.
 * Can keep track of the methods that are not allowed.
 */
export class MethodNotAllowedHttpError extends BaseHttpError {
  public readonly methods: Readonly<string[]>;

  public constructor(methods: string[] = [], message?: string, options?: HttpErrorOptions) {
    super(message ?? `${methods} are not allowed.`, options);
    this.methods = methods;
  }
}
