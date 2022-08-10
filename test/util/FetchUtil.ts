import fetch from 'cross-fetch';

/**
 * This is specifically for GET requests which are expected to succeed.
 */
export async function getEntity(
  url: string,
  options?: { accept?: string },
  expected?: { contentType?: string },
): Promise<Response> {
  const response = await fetch(url, { headers: options });
  expect(response.status).toBe(200);

  if (expected?.contentType) {
    expect(response.headers.get('content-type')).toBe(expected.contentType);
  }

  return response;
}

export type CreateOptions = {
  contentType: string;
  isContainer?: boolean;
  slug?: string;
  body?: string;
};
/**
 * This is specifically for POST requests which are expected to succeed.
 */
export async function postEntity(url: string, options: CreateOptions): Promise<Response> {
  const init: RequestInit = {
    method: 'POST',
    // eslint-disable-next-line @typescript-eslint/naming-convention
    headers: { 'content-type': options.contentType },
    body: options.body,
  };
  const response = await fetch(url, init);
  expect(response.status).toBe(201);
  return response;
}
