import type { Finalizable } from '../../init/finalize/Finalizable';
import type { Repository } from './Repository';

/**
 * An abstraction on the Data Mapper pattern to be implemented using a specific ORM library.
 */
export interface DataMapper extends Finalizable {
  /**
   * Initializes the Data Mapper.
   */
  initialize: () => Promise<void>;
  /**
   * Shuts down the Data Mapper when the application is stopping.
   */
  finalize: () => Promise<void>;
  /**
   * Gets a Repository from the Data Mapper.
   */
  getRepository: (repositoryName: string) => Repository;
  /**
   * Drops the database and all its data. Be careful!
   * This method will erase all your database tables and their data.
   */
  dropDatabase: () => Promise<void>;
}
