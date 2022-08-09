/* eslint-disable tsdoc/syntax */
// tsdoc/syntax cannot handle `@range`
import type { EntitySchema, DataSourceOptions } from 'typeorm';
import { DataSource } from 'typeorm';
import type { DataMapper } from './DataMapper';
import type { Repository } from './Repository';
import type { TypeOrmEntitySchemaFactory } from './schemas/TypeOrmEntitySchemaFactory';
import { TypeOrmRepository } from './TypeOrmRepository';

export class TypeOrmDataMapper implements DataMapper {
  private readonly entitySchemaFactories: TypeOrmEntitySchemaFactory<any>[];
  private readonly options: DataSourceOptions;
  private entitySchemas: Record<string, EntitySchema> = {};
  private dataSource?: DataSource;

  /**
 * @param options - JSON options for the TypeORM DataSource @range {json}
 * @param entitySchemaFactories - An array of factories to generate TypeORM Entity Schemas.
 */
  public constructor(options: DataSourceOptions, entitySchemaFactories: TypeOrmEntitySchemaFactory<any>[]) {
    this.entitySchemaFactories = entitySchemaFactories;
    this.options = options;
  }

  public async initialize(): Promise<void> {
    const entitySchemas = this.entitySchemaFactories.map((factory): EntitySchema => factory.generate());
    for (const entitySchema of entitySchemas) {
      this.entitySchemas[entitySchema.options.name] = entitySchema;
    }

    this.dataSource = new DataSource({
      ...this.options,
      entities: entitySchemas,
    });
  }

  public getRepository<T>(entityType: string): Repository {
    if (!this.dataSource) {
      throw new Error('The Data Source has not been initialized yet.');
    }
    const entitySchema = this.entitySchemas[entityType];
    if (!entitySchema) {
      throw new Error(`No entity schema called ${entityType} found.`);
    }
    const typeOrmRepository = this.dataSource.getRepository<T>(entitySchema);
    return new TypeOrmRepository<T>(typeOrmRepository);
  }
}
