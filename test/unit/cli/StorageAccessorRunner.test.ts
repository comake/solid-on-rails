/* eslint-disable @typescript-eslint/naming-convention */
import { ComponentsManager } from 'componentsjs';
import { StorageAccessorRunner } from '../../../src/cli/StorageAccessorRunner';
import type { App } from '../../../src/init/App';
import type { CliExtractor } from '../../../src/init/cli/CliExtractor';
import type { SettingsResolver } from '../../../src/init/variables/SettingsResolver';
import type { TypeOrmDataMapper } from '../../../src/storage/data-mapper/TypeOrmDataMapper';
import type { KeyValueStorage } from '../../../src/storage/keyvalue/KeyValueStorage';
import type { CliParameters } from '../../../src/util/ComponentsJsUtil';
import { joinFilePath } from '../../../src/util/PathUtil';

const app: jest.Mocked<App> = {
  start: jest.fn(),
  stop: jest.fn(),
} as any;

const dataMapper: jest.Mocked<TypeOrmDataMapper> = {
  initialize: jest.fn(),
  dropDatabase: jest.fn(),
  runPendingMigrations: jest.fn(),
  revertLastMigration: jest.fn(),
  setupDatabase: jest.fn(),
} as any;

const keyValue: jest.Mocked<KeyValueStorage<any, any>> = {
  entries: jest.fn().mockReturnValue([[ 'key', 'value' ], [ 'key2', 'value2' ]]),
  delete: jest.fn(),
} as any;

const instances = {
  app,
  dataMapper,
  keyValue,
};

const defaultParameters = {
  port: 3000,
  logLevel: 'info',
};

const cliExtractor: jest.Mocked<CliExtractor> = {
  handleSafe: jest.fn().mockResolvedValue(defaultParameters),
} as any;

const defaultVariables = {
  'urn:solid-on-rails:default:variable:port': 3000,
  'urn:solid-on-rails:default:variable:loggingLevel': 'info',
};

const settingsResolver: jest.Mocked<SettingsResolver> = {
  handleSafe: jest.fn().mockResolvedValue(defaultVariables),
} as any;

const manager: jest.Mocked<ComponentsManager<Record<string, any>>> = {
  instantiate: jest.fn(async(iri: string): Promise<any> => {
    switch (iri) {
      case 'urn:solid-on-rails-setup:default:CliResolver': return { cliExtractor, settingsResolver };
      case 'urn:solid-on-rails:storage-accessor:Instances': return instances;
      default: throw new Error('unknown iri');
    }
  }),
  configRegistry: {
    register: jest.fn(),
  },
} as any;

jest.mock('componentsjs', (): any => ({
  ComponentsManager: {
    build: jest.fn(async(): Promise<ComponentsManager<Record<string, any>>> => manager),
  },
}));

jest.spyOn(process, 'cwd').mockReturnValue('/var/cwd');

const seedsFunction = jest.fn();
jest.mock(
  '/var/cwd/db/seeds.js',
  (): any => seedsFunction,
  { virtual: true },
);

describe('StorageAccessorRunner', (): void => {
  let params: CliParameters;

  beforeEach(async(): Promise<void> => {
    params = {
      config: './config.json',
      loggingLevel: 'info',
      mainModulePath: undefined,
      modulePathPlaceholder: '@SoR:',
      envVarPrefix: '',
    };
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  describe('seedStorages', (): void => {
    it('runs the server and executes the seeds file.', async(): Promise<void> => {
      const runner = new StorageAccessorRunner();
      await expect(runner.seedStorages(params, [ 'node', 'script' ])).resolves.toBeUndefined();
      expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
      expect(ComponentsManager.build).toHaveBeenCalledWith({
        dumpErrorState: true,
        logLevel: 'info',
        mainModulePath: joinFilePath(__dirname, '../../../'),
      });
      expect(manager.configRegistry.register).toHaveBeenCalledTimes(1);
      expect(manager.configRegistry.register).toHaveBeenCalledWith('/var/cwd/config.json');
      expect(manager.instantiate).toHaveBeenCalledTimes(2);
      expect(manager.instantiate).toHaveBeenNthCalledWith(
        1,
        'urn:solid-on-rails-setup:default:CliResolver',
        { variables: { 'urn:solid-on-rails:default:variable:modulePathPlaceholder': '@SoR:' }},
      );
      expect(cliExtractor.handleSafe).toHaveBeenCalledTimes(1);
      expect(cliExtractor.handleSafe).toHaveBeenCalledWith({ argv: [ 'node', 'script' ], envVarPrefix: '' });
      expect(settingsResolver.handleSafe).toHaveBeenCalledTimes(1);
      expect(settingsResolver.handleSafe).toHaveBeenCalledWith(defaultParameters);
      expect(manager.instantiate).toHaveBeenNthCalledWith(2,
        'urn:solid-on-rails:storage-accessor:Instances',
        { variables: defaultVariables });
      expect(app.start).toHaveBeenCalledTimes(1);
      expect(seedsFunction).toHaveBeenCalledTimes(1);
      expect(seedsFunction).toHaveBeenCalledWith({
        instances: {
          dataMapper,
          keyValue,
        },
        env: params,
      });
      expect(app.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe('dropStorages', (): void => {
    it(`runs the server and initializes then drops the database of the data mapper 
    and deletes all entries from the key value store.`,
    async(): Promise<void> => {
      const runner = new StorageAccessorRunner();
      await expect(runner.dropStorages(params, [ 'node', 'script' ])).resolves.toBeUndefined();
      expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
      expect(ComponentsManager.build).toHaveBeenCalledWith({
        dumpErrorState: true,
        logLevel: 'info',
        mainModulePath: joinFilePath(__dirname, '../../../'),
      });
      expect(manager.configRegistry.register).toHaveBeenCalledTimes(1);
      expect(manager.configRegistry.register).toHaveBeenCalledWith('/var/cwd/config.json');
      expect(manager.instantiate).toHaveBeenCalledTimes(2);
      expect(manager.instantiate).toHaveBeenNthCalledWith(
        1,
        'urn:solid-on-rails-setup:default:CliResolver',
        { variables: { 'urn:solid-on-rails:default:variable:modulePathPlaceholder': '@SoR:' }},
      );
      expect(cliExtractor.handleSafe).toHaveBeenCalledTimes(1);
      expect(cliExtractor.handleSafe).toHaveBeenCalledWith({ argv: [ 'node', 'script' ], envVarPrefix: '' });
      expect(settingsResolver.handleSafe).toHaveBeenCalledTimes(1);
      expect(settingsResolver.handleSafe).toHaveBeenCalledWith(defaultParameters);
      expect(manager.instantiate).toHaveBeenNthCalledWith(2,
        'urn:solid-on-rails:storage-accessor:Instances',
        { variables: defaultVariables });
      expect(app.start).toHaveBeenCalledTimes(1);
      expect(dataMapper.initialize).toHaveBeenCalledTimes(1);
      expect(dataMapper.dropDatabase).toHaveBeenCalledTimes(1);
      expect(keyValue.entries).toHaveBeenCalledTimes(1);
      expect(keyValue.delete).toHaveBeenCalledTimes(2);
      expect(keyValue.delete).toHaveBeenNthCalledWith(1, 'key');
      expect(keyValue.delete).toHaveBeenNthCalledWith(2, 'key2');
      expect(app.stop).toHaveBeenCalledTimes(1);
    });
  });

  describe('setupDatabase', (): void => {
    it(`runs the server and initializes the data mapper then sets up the database.`,
      async(): Promise<void> => {
        const runner = new StorageAccessorRunner();
        await expect(runner.setupDatabase(params, [ 'node', 'script' ])).resolves.toBeUndefined();
        expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
        expect(ComponentsManager.build).toHaveBeenCalledWith({
          dumpErrorState: true,
          logLevel: 'info',
          mainModulePath: joinFilePath(__dirname, '../../../'),
        });
        expect(manager.configRegistry.register).toHaveBeenCalledTimes(1);
        expect(manager.configRegistry.register).toHaveBeenCalledWith('/var/cwd/config.json');
        expect(manager.instantiate).toHaveBeenCalledTimes(2);
        expect(manager.instantiate).toHaveBeenNthCalledWith(
          1,
          'urn:solid-on-rails-setup:default:CliResolver',
          { variables: { 'urn:solid-on-rails:default:variable:modulePathPlaceholder': '@SoR:' }},
        );
        expect(cliExtractor.handleSafe).toHaveBeenCalledTimes(1);
        expect(cliExtractor.handleSafe).toHaveBeenCalledWith({ argv: [ 'node', 'script' ], envVarPrefix: '' });
        expect(settingsResolver.handleSafe).toHaveBeenCalledTimes(1);
        expect(settingsResolver.handleSafe).toHaveBeenCalledWith(defaultParameters);
        expect(manager.instantiate).toHaveBeenNthCalledWith(2,
          'urn:solid-on-rails:storage-accessor:Instances',
          { variables: defaultVariables });
        expect(app.start).toHaveBeenCalledTimes(1);
        expect(dataMapper.initialize).toHaveBeenCalledTimes(1);
        expect(dataMapper.setupDatabase).toHaveBeenCalledTimes(1);
        expect(app.stop).toHaveBeenCalledTimes(1);
      });
  });

  describe('runPendingMigrations', (): void => {
    it(`runs the server and initializes the data mapper then runs pending migrations.`,
      async(): Promise<void> => {
        const runner = new StorageAccessorRunner();
        await expect(runner.runPendingMigrations(params, [ 'node', 'script' ])).resolves.toBeUndefined();
        expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
        expect(ComponentsManager.build).toHaveBeenCalledWith({
          dumpErrorState: true,
          logLevel: 'info',
          mainModulePath: joinFilePath(__dirname, '../../../'),
        });
        expect(manager.configRegistry.register).toHaveBeenCalledTimes(1);
        expect(manager.configRegistry.register).toHaveBeenCalledWith('/var/cwd/config.json');
        expect(manager.instantiate).toHaveBeenCalledTimes(2);
        expect(manager.instantiate).toHaveBeenNthCalledWith(
          1,
          'urn:solid-on-rails-setup:default:CliResolver',
          { variables: { 'urn:solid-on-rails:default:variable:modulePathPlaceholder': '@SoR:' }},
        );
        expect(cliExtractor.handleSafe).toHaveBeenCalledTimes(1);
        expect(cliExtractor.handleSafe).toHaveBeenCalledWith({ argv: [ 'node', 'script' ], envVarPrefix: '' });
        expect(settingsResolver.handleSafe).toHaveBeenCalledTimes(1);
        expect(settingsResolver.handleSafe).toHaveBeenCalledWith(defaultParameters);
        expect(manager.instantiate).toHaveBeenNthCalledWith(2,
          'urn:solid-on-rails:storage-accessor:Instances',
          { variables: defaultVariables });
        expect(app.start).toHaveBeenCalledTimes(1);
        expect(dataMapper.initialize).toHaveBeenCalledTimes(1);
        expect(dataMapper.runPendingMigrations).toHaveBeenCalledTimes(1);
        expect(app.stop).toHaveBeenCalledTimes(1);
      });
  });

  describe('revertLastMigration', (): void => {
    it(`runs the server and initializes the data mapper then runs pending migrations.`,
      async(): Promise<void> => {
        const runner = new StorageAccessorRunner();
        await expect(runner.revertLastMigration(params, [ 'node', 'script' ])).resolves.toBeUndefined();
        expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
        expect(ComponentsManager.build).toHaveBeenCalledWith({
          dumpErrorState: true,
          logLevel: 'info',
          mainModulePath: joinFilePath(__dirname, '../../../'),
        });
        expect(manager.configRegistry.register).toHaveBeenCalledTimes(1);
        expect(manager.configRegistry.register).toHaveBeenCalledWith('/var/cwd/config.json');
        expect(manager.instantiate).toHaveBeenCalledTimes(2);
        expect(manager.instantiate).toHaveBeenNthCalledWith(
          1,
          'urn:solid-on-rails-setup:default:CliResolver',
          { variables: { 'urn:solid-on-rails:default:variable:modulePathPlaceholder': '@SoR:' }},
        );
        expect(cliExtractor.handleSafe).toHaveBeenCalledTimes(1);
        expect(cliExtractor.handleSafe).toHaveBeenCalledWith({ argv: [ 'node', 'script' ], envVarPrefix: '' });
        expect(settingsResolver.handleSafe).toHaveBeenCalledTimes(1);
        expect(settingsResolver.handleSafe).toHaveBeenCalledWith(defaultParameters);
        expect(manager.instantiate).toHaveBeenNthCalledWith(2,
          'urn:solid-on-rails:storage-accessor:Instances',
          { variables: defaultVariables });
        expect(app.start).toHaveBeenCalledTimes(1);
        expect(dataMapper.initialize).toHaveBeenCalledTimes(1);
        expect(dataMapper.revertLastMigration).toHaveBeenCalledTimes(1);
        expect(app.stop).toHaveBeenCalledTimes(1);
      });
  });
});
