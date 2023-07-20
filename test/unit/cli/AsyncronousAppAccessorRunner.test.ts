/* eslint-disable @typescript-eslint/naming-convention */
import { ComponentsManager } from 'componentsjs';
import { AsyncronousAppAccessorRunner } from '../../../src/cli/AsyncronousAppAccessorRunner';
import type { App } from '../../../src/init/App';
import type { CliExtractor } from '../../../src/init/cli/CliExtractor';
import type { SettingsResolver } from '../../../src/init/variables/SettingsResolver';
import { getLoggerFor } from '../../../src/logging/LogUtil';
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
      case 'urn:solid-on-rails:dummy:Instances': return instances;
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

class DummyAccessorRunner extends AsyncronousAppAccessorRunner {
  protected readonly instantiationErrorMessage = 'Could not create the dummy';
  protected readonly defaultInstancesUri = 'urn:solid-on-rails:dummy:Instances';
  protected readonly logger = getLoggerFor(this);
}

describe('An AsyncronousAppAccessorRunner', (): void => {
  const argv = [ 'node', 'script' ];
  let params: CliParameters;
  let callback: any;

  beforeEach(async(): Promise<void> => {
    params = {
      config: './config.json',
      loggingLevel: 'info',
      mainModulePath: undefined,
      modulePathPlaceholder: '@SoR:',
      envVarPrefix: '',
    };
    callback = jest.fn();
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  it('runs the app, executes a callback then stops the app.', async(): Promise<void> => {
    const runner = new DummyAccessorRunner();
    await expect(runner.runAppAndExecuteCallbackWithInstancesAndEnv(params, argv, callback))
      .resolves.toBeUndefined();
    expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
    expect(ComponentsManager.build).toHaveBeenCalledWith({
      dumpErrorState: true,
      logLevel: 'info',
      mainModulePath: joinFilePath(__dirname, '../../../'),
      typeChecking: false,
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
      'urn:solid-on-rails:dummy:Instances',
      { variables: defaultVariables });
    expect(app.start).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith({
      instances: {
        dataMapper,
        keyValue,
      },
      env: params,
    });
    expect(app.stop).toHaveBeenCalledTimes(1);
  });

  it('throws an error if the app fails to start.', async(): Promise<void> => {
    app.start.mockRejectedValue('Failed to start the server.');
    const runner = new DummyAccessorRunner();
    await expect(runner.runAppAndExecuteCallbackWithInstancesAndEnv(params, argv, callback))
      .rejects.toThrow('Could not create the dummy');
    expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
    expect(ComponentsManager.build).toHaveBeenCalledWith({
      dumpErrorState: true,
      logLevel: 'info',
      mainModulePath: joinFilePath(__dirname, '../../../'),
      typeChecking: false,
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
      'urn:solid-on-rails:dummy:Instances',
      { variables: defaultVariables });
    expect(app.start).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(0);
    expect(app.stop).toHaveBeenCalledTimes(1);
  });

  it('throws an error if callback fails.', async(): Promise<void> => {
    callback.mockRejectedValue('Unknown error.');
    const runner = new DummyAccessorRunner();
    await expect(runner.runAppAndExecuteCallbackWithInstancesAndEnv(params, argv, callback))
      .rejects.toThrow('Could not create the dummy');
    expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
    expect(ComponentsManager.build).toHaveBeenCalledWith({
      dumpErrorState: true,
      logLevel: 'info',
      mainModulePath: joinFilePath(__dirname, '../../../'),
      typeChecking: false,
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
      'urn:solid-on-rails:dummy:Instances',
      { variables: defaultVariables });
    expect(app.start).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledTimes(0);
    expect(app.stop).toHaveBeenCalledTimes(1);
  });
});
