import type { TypeOrmDataMapper } from '../../storage/data-mapper/TypeOrmDataMapper';
import { Initializer } from './Initializer';

/**
 * Sets up the global data source.
 */
export class DataMapperInitializer extends Initializer {
  private readonly dataMapper: TypeOrmDataMapper;

  public constructor(dataMapper: TypeOrmDataMapper) {
    super();
    this.dataMapper = dataMapper;
  }

  public async handle(): Promise<void> {
    await this.dataMapper.initialize();
  }
}
