/* eslint-disable tsdoc/syntax */
// tsdoc/syntax cannot handle `@range`
import type { EntitySchema, DataSourceOptions,
  Repository, ObjectLiteral, MigrationInterface, MixedList } from 'typeorm';
import { DataSource } from 'typeorm';
import type { Finalizable } from '../../init/finalize/Finalizable';
import type { TypeOrmEntitySchemaFactory } from './schemas/TypeOrmEntitySchemaFactory';

export interface TypeOrmDataMapperArgs {
  migrations?: MigrationInterface[];
  entitySchemaFactories?: TypeOrmEntitySchemaFactory<any>[];
}

export class TypeOrmDataMapper implements Finalizable {
  private readonly entitySchemaFactories?: TypeOrmEntitySchemaFactory<any>[];
  private readonly migrations: MigrationInterface[];
  private readonly options: DataSourceOptions;
  private entitySchemas: Record<string, EntitySchema> = {};
  private dataSource?: DataSource;

  /**
   * @param options - JSON options for the TypeORM DataSource @range {json}
   * @param args - The remaining optional parameters for the Data Mapper.
   */
  public constructor(options: DataSourceOptions, args?: TypeOrmDataMapperArgs) {
    this.entitySchemaFactories = args?.entitySchemaFactories;
    this.options = options;
    this.migrations = args?.migrations ?? [];
  }

  public async initialize(): Promise<void> {
    const entitySchemas = this.generateEntitySchemas();
    for (const entitySchema of entitySchemas) {
      this.entitySchemas[entitySchema.options.name] = entitySchema;
    }

    this.dataSource = new DataSource({
      ...this.options,
      entities: entitySchemas,
      migrations: this.migrations as unknown as MixedList<() => any>,
    });
    await this.dataSource.initialize();
  }

  public async setupDatabase(): Promise<void> {
    this.ensureDatabaseIsInitialised();
    await this.dataSource!.synchronize();
  }

  private generateEntitySchemas(): EntitySchema[] {
    if (this.entitySchemaFactories) {
      return this.entitySchemaFactories.map((factory): EntitySchema => factory.generate());
    }
    return [];
  }

  public async finalize(): Promise<void> {
    if (this.dataSource) {
      await this.dataSource.destroy();
    }
  }

  public getRepository<T extends ObjectLiteral>(entityType: string): Repository<T> {
    this.ensureDatabaseIsInitialised();

    const entitySchema = this.entitySchemas[entityType];
    if (!entitySchema) {
      throw new Error(`No entity schema called ${entityType} found.`);
    }
    return this.dataSource!.getRepository<T>(entitySchema);
  }

  public async dropDatabase(): Promise<void> {
    this.ensureDatabaseIsInitialised();
    await this.dataSource!.dropDatabase();
  }

  private ensureDatabaseIsInitialised(): void {
    if (!this.dataSource || !this.dataSource.isInitialized) {
      throw new Error('The Data Source has not been initialized yet.');
    }
  }

  public async runPendingMigrations(): Promise<void> {
    this.ensureDatabaseIsInitialised();
    await this.dataSource!.runMigrations();
  }

  public async revertLastMigration(): Promise<void> {
    this.ensureDatabaseIsInitialised();
    await this.dataSource!.undoLastMigration();
  }
}
