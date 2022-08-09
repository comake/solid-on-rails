import type { DataSourceOptions } from 'typeorm';
import { DataSource } from 'typeorm';
import type {
  TypeOrmEntitySchemaFactory,
} from '../../../../src/storage/data-mapper/schemas/TypeOrmEntitySchemaFactory';
import { TypeOrmDataMapper } from '../../../../src/storage/data-mapper/TypeOrmDataMapper';
import { TypeOrmRepository } from '../../../../src/storage/data-mapper/TypeOrmRepository';

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
    dataSource = { getRepository: jest.fn() } as any;
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

  it('throws an error when getting a repository before the data maooer has been initialized.',
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
    await mapper.initialize();
    expect(mapper.getRepository('Users')).toBeInstanceOf(TypeOrmRepository);
    expect(dataSource.getRepository).toHaveBeenCalledTimes(1);
  });
});
