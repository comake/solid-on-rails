/* eslint-disable @typescript-eslint/naming-convention */
import type { App } from '../../src/init/App';
import { baseColumnSchemaPart } from '../../src/storage/data-mapper/schemas/BaseColumnSchemaPart';
import { TypeOrmEntitySchemaFactory } from '../../src/storage/data-mapper/schemas/TypeOrmEntitySchemaFactory';
import type { TypeOrmDataMapper } from '../../src/storage/data-mapper/TypeOrmDataMapper';
import { getPort, describeIf } from '../util/Util';
import { getTestConfigPath, instantiateFromConfig, getDefaultVariables } from './Config';

const port = getPort('DataMapper');
const baseUrl = `http://localhost:${port}`;

interface User {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  name: string;
}

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

describeIf('docker', 'An http server with Postgres Data Mapper storage', (): void => {
  const unsavedUser = { name: 'Adler Faulkner' } as Partial<User>;
  let app: App;
  const userEntitySchemaFactory = new UserEntitySchemaFactory();
  let savedUser: User;
  let dataMapper: TypeOrmDataMapper;

  beforeAll(async(): Promise<void> => {
    const instances = await instantiateFromConfig(
      'urn:solid-on-rails:test:Instances',
      getTestConfigPath('data-mapper.json'),
      {
        ...getDefaultVariables(port, baseUrl),
        'urn:solid-on-rails:test:UserEntitySchemaFactory': userEntitySchemaFactory,
      },
    ) as Record<string, any>;
    ({ app, dataMapper } = instances);
    await app.start();
    await dataMapper.setupDatabase();
  });

  afterAll(async(): Promise<void> => {
    const userRepository = dataMapper.getRepository<User>('User');
    await userRepository.clear();
    await app.stop();
  });

  it('can create an entitiy.', async(): Promise<void> => {
    const userRepository = dataMapper.getRepository<User>('User');
    const user = userRepository.create(unsavedUser);
    savedUser = await userRepository.save(user);
    expect(savedUser).toMatchObject(
      expect.objectContaining({
        id: expect.any(Number),
        name: 'Adler Faulkner',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }),
    );
  });

  it('can get an entitiy.', async(): Promise<void> => {
    const userRepository = dataMapper.getRepository<User>('User');
    await expect(userRepository.findOneBy({ name: unsavedUser.name })).resolves.toEqual(savedUser);
  });
});
