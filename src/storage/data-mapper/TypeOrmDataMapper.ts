/* eslint-disable tsdoc/syntax */
// tsdoc/syntax cannot handle `@range`
import { promises as fs } from 'fs';
import type { EntitySchema, DataSourceOptions,
  Repository, ObjectLiteral, MixedList, MigrationInterface } from 'typeorm';
import { DataSource } from 'typeorm';
import type { Finalizable } from '../../init/finalize/Finalizable';
import { absoluteFilePath, joinFilePath } from '../../util/PathUtil';
import type { TypeOrmEntitySchemaFactory } from './schemas/TypeOrmEntitySchemaFactory';

export class TypeOrmDataMapper implements Finalizable {
  private readonly entitySchemaFactories?: TypeOrmEntitySchemaFactory<any>[];
  private readonly options: DataSourceOptions;
  private entitySchemas: Record<string, EntitySchema> = {};
  private dataSource?: DataSource;

  /**
   * @param options - JSON options for the TypeORM DataSource @range {json}
   * @param args - The remaining optional parameters for the Data Mapper.
   */
  public constructor(options: DataSourceOptions, entitySchemaFactories?: TypeOrmEntitySchemaFactory<any>[]) {
    this.entitySchemaFactories = entitySchemaFactories;
    this.options = options;
  }

  public async initialize(): Promise<void> {
    const entities = this.generateEntitySchemas();
    for (const entitySchema of entities) {
      this.entitySchemas[entitySchema.options.name] = entitySchema;
    }
    const migrations = await this.getMigrations() as unknown as MixedList<() => any>;
    this.dataSource = new DataSource({ ...this.options, entities, migrations });
    await this.dataSource.initialize();
  }

  private generateEntitySchemas(): EntitySchema[] {
    if (this.entitySchemaFactories) {
      return this.entitySchemaFactories.map((factory): EntitySchema => factory.generate());
    }
    return [];
  }

  private async getMigrations(): Promise<MigrationInterface[]> {
    const migrationsFolderPath = absoluteFilePath('./db/migrations/');
    try {
      const fileNames = await fs.readdir(migrationsFolderPath);
      return fileNames.map((fileName): MigrationInterface =>
        // eslint-disable-next-line global-require, @typescript-eslint/no-require-imports
        require(joinFilePath(migrationsFolderPath, fileName)));
    } catch {
      return [];
    }
  }

  public async setupDatabase(): Promise<void> {
    this.ensureDatabaseIsInitialised();
    await this.dataSource!.synchronize();
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
