/**
 * A Repositories within the Data Mapper framework acts as a boundary between
 * the data access logic and Application Domain logic. This boundary helps to
 * reduce the complexity of rehydrating your entities and keeps a direct
 * dependency on a particular datastore out of your domain.
 */
export interface Repository {
  create: (...args: any[]) => Promise<any>;

  find: (...args: any[]) => Promise<any>;

  query: (...args: any[]) => Promise<any>;

  save: (...args: any[]) => Promise<any>;

  update: (...args: any[]) => Promise<any>;

  delete: (...args: any[]) => Promise<any>;

  remove: (...args: any[]) => Promise<any>;

  count: (...args: any[]) => Promise<any>;
}
