import type { DataSourceOptions } from 'typeorm';
import { DataSource } from 'typeorm';
import type {
  TypeOrmEntitySchemaFactory,
} from '../../../../src/storage/data-mapper/schemas/TypeOrmEntitySchemaFactory';
import { TypeOrmDataMapper } from '../../../../src/storage/data-mapper/TypeOrmDataMapper';

jest.mock('typeorm');

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
      synchronize: jest.fn(),
      destroy: jest.fn(),
      isInitialized: false,
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
      });
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

  it('drops the database.', async(): Promise<void> => {
    await mapper.initialize();
    await mapper.dropDatabase();
    expect(dataSource.dropDatabase).toHaveBeenCalledTimes(1);
  });
});
