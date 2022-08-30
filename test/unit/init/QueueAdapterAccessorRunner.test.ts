/* eslint-disable @typescript-eslint/naming-convention */
import { ComponentsManager } from 'componentsjs';
import type { App } from '../../../src/init/App';
import type { CliExtractor } from '../../../src/init/cli/CliExtractor';
import { QueueAdapterAccessorRunner } from '../../../src/init/QueueAdapterAccessorRunner';
import type { SettingsResolver } from '../../../src/init/variables/SettingsResolver';
import type { TypeOrmDataMapper } from '../../../src/storage/data-mapper/TypeOrmDataMapper';
import type { KeyValueStorage } from '../../../src/storage/keyvalue/KeyValueStorage';
import { joinFilePath } from '../../../src/util/PathUtil';

const app: jest.Mocked<App> = {
  start: jest.fn(),
} as any;

const dataMapper: jest.Mocked<TypeOrmDataMapper> = {
  initialize: jest.fn(),
} as any;

const keyValue: jest.Mocked<KeyValueStorage<any, any>> = {
  get: jest.fn(),
  has: jest.fn(),
  set: jest.fn(),
  entries: jest.fn(),
} as any;

const instances = {
  app,
  dataMapper,
  keyValue,
  env: {},
};

const defaultParameters = {
  port: 3000,
  logLevel: 'info',
};

const cliExtractor: jest.Mocked<CliExtractor> = {
  handleSafe: jest.fn().mockResolvedValue(defaultParameters),
} as any;

const defaultVariables = {
  'urn:skl-app-server:default:variable:port': 3000,
  'urn:skl-app-server:default:variable:loggingLevel': 'info',
};

const settingsResolver: jest.Mocked<SettingsResolver> = {
  handleSafe: jest.fn().mockResolvedValue(defaultVariables),
} as any;

const manager: jest.Mocked<ComponentsManager<Record<string, any>>> = {
  instantiate: jest.fn(async(iri: string): Promise<any> => {
    switch (iri) {
      case 'urn:skl-app-server-setup:default:CliResolver': return { cliExtractor, settingsResolver };
      case 'urn:skl-app-server:queue-accessor:Instances': return instances;
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
const write = jest.spyOn(process.stderr, 'write').mockImplementation(jest.fn());
const exit = jest.spyOn(process, 'exit').mockImplementation(jest.fn() as any);

describe('QueueAdapterAccessorRunner', (): void => {
  afterEach((): void => {
    jest.clearAllMocks();
  });

  describe('run', (): void => {
    it('runs the server.', async(): Promise<void> => {
      await expect(new QueueAdapterAccessorRunner().run({ argv: [ 'node', 'script' ]})).resolves.toEqual(
        expect.objectContaining({
          ...instances,
          env: expect.any(Object),
        }),
      );

      expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
      expect(ComponentsManager.build).toHaveBeenCalledWith({
        dumpErrorState: true,
        logLevel: 'info',
        mainModulePath: joinFilePath(__dirname, '../../../'),
      });
      expect(manager.configRegistry.register).toHaveBeenCalledTimes(1);
      expect(manager.configRegistry.register)
        .toHaveBeenCalledWith(joinFilePath(__dirname, '/../../../config/default-queue-accessor.json'));
      expect(manager.instantiate).toHaveBeenCalledTimes(2);
      expect(manager.instantiate).toHaveBeenNthCalledWith(
        1,
        'urn:skl-app-server-setup:default:CliResolver',
        { variables: { 'urn:skl-app-server:default:variable:modulePathPlaceholder': '@sklAppServer:' }},
      );
      expect(cliExtractor.handleSafe).toHaveBeenCalledTimes(1);
      expect(cliExtractor.handleSafe).toHaveBeenCalledWith({ argv: [ 'node', 'script' ], envVarPrefix: '' });
      expect(settingsResolver.handleSafe).toHaveBeenCalledTimes(1);
      expect(settingsResolver.handleSafe).toHaveBeenCalledWith(defaultParameters);
      expect(manager.instantiate).toHaveBeenNthCalledWith(2,
        'urn:skl-app-server:queue-accessor:Instances',
        { variables: defaultVariables });
      expect(app.start).toHaveBeenCalledTimes(1);
      expect(app.start).toHaveBeenLastCalledWith();
    });

    it('runs the server honoring env variables.', async(): Promise<void> => {
      // Set logging level to debug
      const { env } = process;
      const OLD_STATE = env.CUSTOM_ENV_PREFIX_LOGGING_LEVEL;
      env.CUSTOM_ENV_PREFIX_LOGGING_LEVEL = 'debug';
      await expect(
        new QueueAdapterAccessorRunner().run({ argv: [ 'node', 'script', '--envVarPrefix=CUSTOM_ENV_PREFIX' ]}),
      ).resolves.toEqual(
        expect.objectContaining({
          ...instances,
          env: expect.any(Object),
        }),
      );

      expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
      // Check logLevel to be set to debug instead of default `info`
      expect(ComponentsManager.build).toHaveBeenCalledWith({
        dumpErrorState: true,
        logLevel: 'debug',
        mainModulePath: joinFilePath(__dirname, '../../../'),
      });
      expect(manager.configRegistry.register).toHaveBeenCalledTimes(1);
      expect(manager.configRegistry.register)
        .toHaveBeenCalledWith(joinFilePath(__dirname, '/../../../config/default-queue-accessor.json'));
      expect(manager.instantiate).toHaveBeenCalledTimes(2);
      expect(manager.instantiate).toHaveBeenNthCalledWith(
        1,
        'urn:skl-app-server-setup:default:CliResolver',
        { variables: { 'urn:skl-app-server:default:variable:modulePathPlaceholder': '@sklAppServer:' }},
      );
      expect(cliExtractor.handleSafe).toHaveBeenCalledTimes(1);
      expect(cliExtractor.handleSafe).toHaveBeenCalledWith({
        argv: [ 'node', 'script', '--envVarPrefix=CUSTOM_ENV_PREFIX' ],
        envVarPrefix: 'CUSTOM_ENV_PREFIX',
      });
      expect(settingsResolver.handleSafe).toHaveBeenCalledTimes(1);
      expect(settingsResolver.handleSafe).toHaveBeenCalledWith(defaultParameters);
      expect(manager.instantiate).toHaveBeenNthCalledWith(2,
        'urn:skl-app-server:queue-accessor:Instances',
        { variables: defaultVariables });
      expect(app.start).toHaveBeenCalledTimes(1);
      expect(app.start).toHaveBeenLastCalledWith();

      // Reset env
      if (OLD_STATE) {
        env.CUSTOM_ENV_PREFIX_LOGGING_LEVEL = OLD_STATE;
      } else {
        delete env.CUSTOM_ENV_PREFIX_LOGGING_LEVEL;
      }
    });

    it('uses the default process.argv in case none are provided.', async(): Promise<void> => {
      const { argv } = process;
      const argvParameters = [
        'node', 'script',
        '-b', 'http://example.com/',
        '-c', 'myconfig.json',
        '-f', '/root',
        '-l', 'debug',
        '-m', 'module/path',
        '-p', '4000',
        '-t',
      ];
      process.argv = argvParameters;

      await expect(new QueueAdapterAccessorRunner().run({})).resolves.toEqual(
        expect.objectContaining({
          ...instances,
          env: expect.any(Object),
        }),
      );

      expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
      expect(ComponentsManager.build).toHaveBeenCalledWith({
        dumpErrorState: true,
        logLevel: 'debug',
        mainModulePath: '/var/cwd/module/path',
      });
      expect(manager.configRegistry.register).toHaveBeenCalledTimes(1);
      expect(manager.configRegistry.register)
        .toHaveBeenCalledWith('/var/cwd/myconfig.json');
      expect(manager.instantiate).toHaveBeenCalledTimes(2);
      expect(manager.instantiate).toHaveBeenNthCalledWith(
        1,
        'urn:skl-app-server-setup:default:CliResolver',
        { variables: { 'urn:skl-app-server:default:variable:modulePathPlaceholder': '@sklAppServer:' }},
      );
      expect(cliExtractor.handleSafe).toHaveBeenCalledTimes(1);
      expect(cliExtractor.handleSafe).toHaveBeenCalledWith({ argv: argvParameters, envVarPrefix: '' });
      expect(settingsResolver.handleSafe).toHaveBeenCalledTimes(1);
      expect(settingsResolver.handleSafe).toHaveBeenCalledWith(defaultParameters);
      expect(manager.instantiate).toHaveBeenNthCalledWith(2,
        'urn:skl-app-server:queue-accessor:Instances',
        { variables: defaultVariables });
      expect(app.start).toHaveBeenCalledTimes(1);
      expect(app.start).toHaveBeenLastCalledWith();

      process.argv = argv;
    });

    it('exits the process and writes to stderr if there was an error.', async(): Promise<void> => {
      app.start.mockRejectedValueOnce(new Error('Fatal'));

      await new QueueAdapterAccessorRunner().run({ argv: [ 'node', 'script' ]});

      expect(write).toHaveBeenCalledTimes(1);
      expect(write).toHaveBeenLastCalledWith(expect.stringMatching(/^Could not create the queue adapter/mu));
      expect(write).toHaveBeenLastCalledWith(expect.stringMatching(/Cause: Fatal/mu));

      expect(exit).toHaveBeenCalledTimes(1);
      expect(exit).toHaveBeenLastCalledWith(1);
    });
  });
});
