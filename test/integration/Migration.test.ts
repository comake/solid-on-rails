/* eslint-disable @typescript-eslint/naming-convention */
import type { MigrationInterface, QueryRunner } from 'typeorm';
import { Table } from 'typeorm';
import type { App } from '../../src/init/App';
import { baseColumnSchemaPart } from '../../src/storage/data-mapper/schemas/BaseColumnSchemaPart';
import { TypeOrmEntitySchemaFactory } from '../../src/storage/data-mapper/schemas/TypeOrmEntitySchemaFactory';
import type { TypeOrmDataMapper } from '../../src/storage/data-mapper/TypeOrmDataMapper';
import { PlaceholderPathResolver } from '../../src/util/path/PlaceholderPathResolver';
import { describeIf, getPort, mockFileSystem } from '../util/Util';
import { getDefaultVariables, getTestConfigPath, instantiateFromConfig } from './Config';

const port = getPort('Migration');
const baseUrl = `http://localhost:${port}`;
const pathResolver = new PlaceholderPathResolver('@SoR:');

interface User {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  name: string;
}

const userTable = {
  name: 'user',
  columns: [
    {
      name: 'id',
      type: 'int',
      isPrimary: true,
      isGenerated: true,
    },
    {
      name: 'created_at',
      type: 'timestamp with time zone',
    },
    {
      name: 'updated_at',
      type: 'timestamp with time zone',
    },
    {
      name: 'name',
      type: 'varchar',
    },
  ],
};

const userSchema = {
  name: 'User',
  columns: {
    ...baseColumnSchemaPart,
    name: { type: String },
  },
};

class UserEntitySchemaFactory extends TypeOrmEntitySchemaFactory<User> {
  protected readonly schema = userSchema;
}

class UserMigration1664844570859 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table(userTable));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(userTable.name);
  }
}

describeIf('docker', 'An http server with Postgres Data Mapper storage and migrations to run', (): void => {
  let app: App;
  let dataMapper: TypeOrmDataMapper;
  const userEntitySchemaFactory = new UserEntitySchemaFactory();

  beforeAll(async(): Promise<void> => {
    const { data } = mockFileSystem(pathResolver.resolveAssetPath(''));
    Object.assign(data, {
      './db/migrations/': {
        'UserMigration1664844570859.js': UserMigration1664844570859,
      },
    });

    const instances = await instantiateFromConfig(
      'urn:solid-on-rails:test:Instances',
      getTestConfigPath('migration.json'),
      {
        ...getDefaultVariables(port, baseUrl),
        'urn:solid-on-rails:test:UserEntitySchemaFactory': userEntitySchemaFactory,
      },
    ) as Record<string, any>;
    ({ app, dataMapper } = instances);
    await app.start();
  });

  afterAll(async(): Promise<void> => {
    await app.stop();
  });

  it('can run pending migrations.', async(): Promise<void> => {
    await expect(dataMapper.runPendingMigrations()).resolves.toBeUndefined();
  });

  it('can revert an executed migration.', async(): Promise<void> => {
    await expect(dataMapper.revertLastMigration()).resolves.toBeUndefined();
  });
});
