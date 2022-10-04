import { promises as fs } from 'fs';
import type { DataSourceOptions, MigrationInterface, QueryRunner } from 'typeorm';
import { Table, DataSource } from 'typeorm';
import type {
  TypeOrmEntitySchemaFactory,
} from '../../../../src/storage/data-mapper/schemas/TypeOrmEntitySchemaFactory';
import { TypeOrmDataMapper } from '../../../../src/storage/data-mapper/TypeOrmDataMapper';

const userTable = {
  name: 'user',
  columns: [
    {
      name: 'id',
      type: 'int',
      isPrimary: true,
      isGenerated: true,
    },
  ],
};

class Migration1234 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(new Table(userTable));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable(userTable.name);
  }
}

jest.mock('typeorm');

jest.mock('fs', (): any => {
  const originalModule = jest.requireActual('fs');
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    ...originalModule,
    promises: { readdir: jest.fn().mockResolvedValue([]) },
  };
});

jest.mock(
  '/var/cwd/db/migrations/Migration1234.js',
  (): any => Migration1234,
  { virtual: true },
);

describe('A TypeOrmDataMapper', (): void => {
  const options = {
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    username: 'test',
    password: 'test',
    database: 'test',
  } as DataSourceOptions;
  const usersEntitySchema = { options: { name: 'Users' }};
  const booksEntitySchema = { options: { name: 'Books' }};
  let generateUsers: any;
  let generateBooks: any;
  let entitySchemaFactories: TypeOrmEntitySchemaFactory<any>[];
  let mapper: TypeOrmDataMapper;
  let dataSource: DataSource;
  let dataSourceConstructor: any;

  beforeEach(async(): Promise<void> => {
    jest.resetAllMocks();
    jest.spyOn(process, 'cwd').mockReturnValue('/var/cwd');
    generateUsers = jest.fn().mockReturnValue(usersEntitySchema);
    generateBooks = jest.fn().mockReturnValue(booksEntitySchema);
    entitySchemaFactories = [
      { generate: generateUsers, schema: { name: 'Users', columns: {}}},
      { generate: generateBooks, schema: { name: 'Books', columns: {}}},
    ] as any;
    dataSource = {
      getRepository: jest.fn(),
      dropDatabase: jest.fn(),
      initialize: jest.fn().mockImplementation(async(): Promise<void> => {
        (dataSource as any).isInitialized = true;
      }),
      destroy: jest.fn(),
      isInitialized: false,
      runMigrations: jest.fn(),
      synchronize: jest.fn(),
      undoLastMigration: jest.fn(),
    } as any;
    dataSourceConstructor = jest.fn()
      .mockImplementation((): DataSource => (dataSource as any));
    (DataSource as jest.Mock).mockImplementation(dataSourceConstructor);
    mapper = new TypeOrmDataMapper(options, entitySchemaFactories);
  });

  it('initializes a typeORM DataSource with an EntitySchema for each entity schema factory.',
    async(): Promise<void> => {
      await expect(mapper.initialize()).resolves.toBeUndefined();
      expect(generateUsers).toHaveBeenCalledTimes(1);
      expect(generateBooks).toHaveBeenCalledTimes(1);
      expect(DataSource).toHaveBeenCalledTimes(1);
      expect(DataSource).toHaveBeenCalledWith({
        ...options,
        entities: [
          usersEntitySchema,
          booksEntitySchema,
        ],
        migrations: [],
      });
    });

  it('initializes a typeORM DataSource with a migration for each migration in ./db/migrations.',
    async(): Promise<void> => {
      (fs.readdir as jest.Mock).mockResolvedValue([ 'Migration1234.js' ]);
      await expect(mapper.initialize()).resolves.toBeUndefined();
      expect(generateUsers).toHaveBeenCalledTimes(1);
      expect(generateBooks).toHaveBeenCalledTimes(1);
      expect(DataSource).toHaveBeenCalledTimes(1);
      expect(DataSource).toHaveBeenCalledWith({
        ...options,
        entities: [
          usersEntitySchema,
          booksEntitySchema,
        ],
        migrations: [ Migration1234 ],
      });
    });

  it('initializes a typeORM DataSource with no entity schemas if no factories are provided.',
    async(): Promise<void> => {
      mapper = new TypeOrmDataMapper(options);
      await expect(mapper.initialize()).resolves.toBeUndefined();
      expect(generateUsers).toHaveBeenCalledTimes(0);
      expect(generateBooks).toHaveBeenCalledTimes(0);
      expect(DataSource).toHaveBeenCalledTimes(1);
      expect(DataSource).toHaveBeenCalledWith({ ...options, entities: [], migrations: []});
    });

  it('throws an error when getting a repository before the data mapper has been initialized.',
    async(): Promise<void> => {
      expect((): void => {
        mapper.getRepository('Users');
      }).toThrow(Error);
      expect((): void => {
        mapper.getRepository('Users');
      }).toThrow('The Data Source has not been initialized yet.');
      expect(dataSource.getRepository).toHaveBeenCalledTimes(0);
    });

  it('throws an error when getting a repository that was not initialized.', async(): Promise<void> => {
    await mapper.initialize();
    expect((): void => {
      mapper.getRepository('Authors');
    }).toThrow(Error);
    expect((): void => {
      mapper.getRepository('Authors');
    }).toThrow('No entity schema called Authors found.');
    expect(dataSource.getRepository).toHaveBeenCalledTimes(0);
  });

  it('gets a repository that has been initialized.', async(): Promise<void> => {
    const respository = {} as any;
    (dataSource.getRepository as jest.Mock).mockReturnValue(respository);
    await mapper.initialize();
    expect(mapper.getRepository('Users')).toBe(respository);
    expect(dataSource.getRepository).toHaveBeenCalledTimes(1);
  });

  it('destroys the data source when finalized.', async(): Promise<void> => {
    await mapper.initialize();
    await expect(mapper.finalize()).resolves.toBeUndefined();
    expect(dataSource.destroy).toHaveBeenCalledTimes(1);
  });

  it('sets up the database.', async(): Promise<void> => {
    await mapper.initialize();
    await mapper.setupDatabase();
    expect(dataSource.synchronize).toHaveBeenCalledTimes(1);
  });

  it('drops the database.', async(): Promise<void> => {
    await mapper.initialize();
    await mapper.dropDatabase();
    expect(dataSource.dropDatabase).toHaveBeenCalledTimes(1);
  });

  it('runs pending migrations.', async(): Promise<void> => {
    await mapper.initialize();
    await mapper.runPendingMigrations();
    expect(dataSource.runMigrations).toHaveBeenCalledTimes(1);
  });

  it('reverts the last executed migration.', async(): Promise<void> => {
    await mapper.initialize();
    await mapper.revertLastMigration();
    expect(dataSource.undoLastMigration).toHaveBeenCalledTimes(1);
  });
});
