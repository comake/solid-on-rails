/**
 * Returns a promise which resolves after a specified duration.
 */
export async function wait(duration: number): Promise<void> {
  return new Promise((resolve): void => {
    setTimeout(resolve, duration);
  });
}
