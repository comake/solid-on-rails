import type { KeyValueStorage } from './KeyValueStorage';

export const NAMESPACE_DELIMITER = ':';
/**
 * Transforms the keys into relative paths, to be used by the source storage.
 * Encodes the input key with base64 encoding,
 * to make sure there are no invalid or special path characters,
 * and prepends it with the stored relative path.
 * This can be useful to eventually generate URLs in specific containers
 * without having to worry about cleaning the input keys.
 */
export class EncodingNamespaceStorage<T> implements KeyValueStorage<string, T> {
  private readonly namespace: string;
  private readonly source: KeyValueStorage<string, T>;

  public constructor(namespace: string, source: KeyValueStorage<string, T>) {
    this.source = source;
    this.namespace = namespace;
  }

  public async get(key: string): Promise<T | undefined> {
    const namespacedKey = this.addNamespaceToKey(key);
    return this.source.get(namespacedKey);
  }

  public async has(key: string): Promise<boolean> {
    const namespacedKey = this.addNamespaceToKey(key);
    return this.source.has(namespacedKey);
  }

  public async set(key: string, value: T): Promise<this> {
    const namespacedKey = this.addNamespaceToKey(key);
    await this.source.set(namespacedKey, value);
    return this;
  }

  public async delete(key: string): Promise<boolean> {
    const namespacedKey = this.addNamespaceToKey(key);
    return this.source.delete(namespacedKey);
  }

  public async* entries(): AsyncIterableIterator<[string, T]> {
    for await (const [ namespacedKey, value ] of this.source.entries()) {
      // The only relevant entries for this storage are those that start with the namespace
      if (!namespacedKey.startsWith(this.namespace)) {
        continue;
      }
      const key = this.removeNamespaceFromKey(namespacedKey);
      yield [ key, value ];
    }
  }

  /**
   * Converts a key into a namespaced key for internal storage.
   */
  private addNamespaceToKey(key: string): string {
    const encodedKey = Buffer.from(key).toString('base64');
    return [ this.namespace, encodedKey ].join(NAMESPACE_DELIMITER);
  }

  /**
   * Converts an internal storage namespaced string into the original key.
   */
  private removeNamespaceFromKey(namespacedKey: string): string {
    const buffer = Buffer.from(namespacedKey.slice(this.namespace.length + NAMESPACE_DELIMITER.length), 'base64');
    return buffer.toString('utf-8');
  }
}
