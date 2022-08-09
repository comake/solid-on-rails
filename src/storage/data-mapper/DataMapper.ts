import type { Repository } from './Repository';

/**
 * An abstraction on the Data Mapper pattern to be implemented using a specific ORM library.
 */
export interface DataMapper {
  /**
   * Initializes the Data Mapper.
   */
  initialize: () => Promise<void>;
  /**
   * Gets a Repository from the Data Mapper.
   */
  getRepository: (repositoryName: string) => Repository;
}
