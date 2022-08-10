import type { App } from '../../src/init/App';
import type { User } from '../../src/storage/data-mapper/schemas/UserEntitySchemaFactory';
import { APPLICATION_JSON } from '../../src/util/ContentTypes';
import { postEntity, getEntity } from '../util/FetchUtil';
import { getPort, describeIf } from '../util/Util';
import { getTestConfigPath, instantiateFromConfig, getDefaultVariables } from './Config';

const port = getPort('DataMapper');
const baseUrl = `http://localhost:${port}`;

describeIf('docker', 'An http server with Postgres Data Mapper storage', (): void => {
  let app: App;
  let postedUser: User;

  beforeEach(async(): Promise<void> => {
    const instances = await instantiateFromConfig(
      'urn:skl-app-server:test:Instances',
      getTestConfigPath('data-mapper.json'),
      getDefaultVariables(port, baseUrl),
    ) as Record<string, any>;
    ({ app } = instances);
    await app.start();
  });

  afterEach(async(): Promise<void> => {
    await app.stop();
  });

  it('can post an entitiy.', async(): Promise<void> => {
    const body = JSON.stringify({ user: { name: 'Adler' }});
    const response = await postEntity(`${baseUrl}/users`, { contentType: APPLICATION_JSON, body });
    postedUser = await response.json();
    expect(postedUser.id).toEqual(expect.any(Number));
    expect(postedUser.name).toBe('Adler');
    expect(postedUser.createdAt).toEqual(expect.any(String));
    expect(postedUser.updatedAt).toEqual(expect.any(String));
  });

  it('can get an entitiy.', async(): Promise<void> => {
    const response = await getEntity(`${baseUrl}/users/${postedUser.id}`, undefined, { contentType: APPLICATION_JSON });
    const retrievedUser = await response.json();
    expect(retrievedUser.id).toEqual(expect.any(Number));
    expect(retrievedUser.name).toBe('Adler');
    expect(retrievedUser.createdAt).toEqual(expect.any(String));
    expect(retrievedUser.updatedAt).toEqual(expect.any(String));
  });
});
