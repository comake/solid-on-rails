import { assertError, createErrorMessage, isError, resolveError } from '../../../../src/util/errors/ErrorUtil';

describe('ErrorUtil', (): void => {
  describe('#isError', (): void => {
    it('returns true on native errors.', async(): Promise<void> => {
      expect(isError(new Error('error'))).toBe(true);
    });

    it('returns true on error-like objects.', async(): Promise<void> => {
      expect(isError({ name: 'name', message: 'message', stack: 'stack' })).toBe(true);
    });

    it('returns true on errors without a stack.', async(): Promise<void> => {
      expect(isError({ name: 'name', message: 'message' })).toBe(true);
    });

    it('returns false on other values.', async(): Promise<void> => {
      expect(isError('apple')).toBe(false);
    });
  });

  describe('#assertError', (): void => {
    it('returns undefined on native errors.', async(): Promise<void> => {
      expect(assertError(new Error('error'))).toBeUndefined();
    });

    it('throws on other values.', async(): Promise<void> => {
      expect((): void => assertError('apple')).toThrow('apple');
    });
  });

  describe('#createErrorMessage', (): void => {
    it('returns the given message for normal Errors.', async(): Promise<void> => {
      expect(createErrorMessage(new Error('error msg'))).toBe('error msg');
    });

    it('tries to put the object in a string .', async(): Promise<void> => {
      expect(createErrorMessage('apple')).toBe('Unknown error: apple');
    });
  });

  describe('#resolveError', (): void => {
    it('throws and error with a cause and stack appended.', async(): Promise<void> => {
      let caughtError: Error = new Error('should disappear');
      try {
        resolveError('Something bad happened', new Error('Original error message'));
      } catch (error: unknown) {
        caughtError = error as Error;
      }
      expect(caughtError.message).toMatch(/^Something bad happened/mu);
      expect(caughtError.message).toMatch(/^Cause: Original error message/mu);
      expect(caughtError.message.split('\n')).toHaveLength(14);
    });

    it('does not append the stack if the error is not an Error instance.', async(): Promise<void> => {
      let caughtError: Error = new Error('should disappear');
      try {
        resolveError('Something bad happened', 'Failure');
      } catch (error: unknown) {
        caughtError = error as Error;
      }
      expect(caughtError.message).toMatch(/^Something bad happened/mu);
      expect(caughtError.message).toMatch(/^Cause: Unknown error: Failure/mu);
      expect(caughtError.message.split('\n')).toHaveLength(3);
    });
  });
});
