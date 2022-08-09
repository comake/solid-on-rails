import type { DataMapper } from '../../storage/data-mapper/DataMapper';
import { Initializer } from './Initializer';

/**
 * Sets up the global data source.
 */
export class DataSourceInitializer extends Initializer {
  private readonly dataMapper: DataMapper;

  public constructor(dataMapper: DataMapper) {
    super();
    this.dataMapper = dataMapper;
  }

  public async handle(): Promise<void> {
    await this.dataMapper.initialize();
  }
}
