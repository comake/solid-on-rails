/* eslint-disable @typescript-eslint/naming-convention */
import { ComponentsManager } from 'componentsjs';
import type { App } from '../../../src/init/App';
import { AppRunner } from '../../../src/init/AppRunner';
import type { CliExtractor } from '../../../src/init/cli/CliExtractor';
import type { SettingsResolver } from '../../../src/init/variables/SettingsResolver';
import { joinFilePath } from '../../../src/util/PathUtil';
import { flushPromises } from '../../util/Util';

const app: jest.Mocked<App> = {
  start: jest.fn(),
} as any;

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

const manager: jest.Mocked<ComponentsManager<App>> = {
  instantiate: jest.fn(async(iri: string): Promise<any> => {
    switch (iri) {
      case 'urn:solid-on-rails-setup:default:CliResolver': return { cliExtractor, settingsResolver };
      case 'urn:solid-on-rails:default:App': return app;
      default: throw new Error('unknown iri');
    }
  }),
  configRegistry: {
    register: jest.fn(),
  },
} as any;

jest.mock('componentsjs', (): any => ({
  ComponentsManager: {
    build: jest.fn(async(): Promise<ComponentsManager<App>> => manager),
  },
}));

jest.spyOn(process, 'cwd').mockReturnValue('/var/cwd');
const write = jest.spyOn(process.stderr, 'write').mockImplementation(jest.fn());
const exit = jest.spyOn(process, 'exit').mockImplementation(jest.fn() as any);

describe('AppRunner', (): void => {
  afterEach((): void => {
    jest.clearAllMocks();
  });

  describe('run', (): void => {
    let variables: Record<string, any>;
    beforeEach(async(): Promise<void> => {
      variables = {
        'urn:solid-on-rails:default:variable:port': 3000,
        'urn:solid-on-rails:default:variable:loggingLevel': 'info',
        'urn:solid-on-rails:default:variable:showStackTrace': false,
      };
    });

    it('starts the server with provided settings.', async(): Promise<void> => {
      await new AppRunner().run(
        {
          mainModulePath: joinFilePath(__dirname, '../../../'),
          dumpErrorState: true,
          logLevel: 'info',
        },
        joinFilePath(__dirname, '../../../config/default.json'),
        variables,
      );

      expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
      expect(ComponentsManager.build).toHaveBeenCalledWith({
        dumpErrorState: true,
        logLevel: 'info',
        mainModulePath: joinFilePath(__dirname, '../../../'),
      });
      expect(manager.configRegistry.register).toHaveBeenCalledTimes(1);
      expect(manager.configRegistry.register)
        .toHaveBeenCalledWith(joinFilePath(__dirname, '/../../../config/default.json'));
      expect(manager.instantiate).toHaveBeenCalledTimes(1);
      expect(manager.instantiate).toHaveBeenNthCalledWith(1, 'urn:solid-on-rails:default:App', { variables });
      expect(cliExtractor.handleSafe).toHaveBeenCalledTimes(0);
      expect(settingsResolver.handleSafe).toHaveBeenCalledTimes(0);
      expect(app.start).toHaveBeenCalledTimes(1);
      expect(app.start).toHaveBeenCalledWith();
    });
  });

  describe('runCli', (): void => {
    it('runs the server.', async(): Promise<void> => {
      await expect(new AppRunner().runCli([ 'node', 'script' ])).resolves.toBeUndefined();

      expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
      expect(ComponentsManager.build).toHaveBeenCalledWith({
        dumpErrorState: true,
        logLevel: 'info',
        mainModulePath: joinFilePath(__dirname, '../../../'),
      });
      expect(manager.configRegistry.register).toHaveBeenCalledTimes(1);
      expect(manager.configRegistry.register)
        .toHaveBeenCalledWith(joinFilePath(__dirname, '/../../../config/default.json'));
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
        'urn:solid-on-rails:default:App',
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
        new AppRunner().runCli([ 'node', 'script', '--envVarPrefix=CUSTOM_ENV_PREFIX' ]),
      ).resolves.toBeUndefined();

      expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
      // Check logLevel to be set to debug instead of default `info`
      expect(ComponentsManager.build).toHaveBeenCalledWith({
        dumpErrorState: true,
        logLevel: 'debug',
        mainModulePath: joinFilePath(__dirname, '../../../'),
      });
      expect(manager.configRegistry.register).toHaveBeenCalledTimes(1);
      expect(manager.configRegistry.register)
        .toHaveBeenCalledWith(joinFilePath(__dirname, '/../../../config/default.json'));
      expect(manager.instantiate).toHaveBeenCalledTimes(2);
      expect(manager.instantiate).toHaveBeenNthCalledWith(
        1,
        'urn:solid-on-rails-setup:default:CliResolver',
        { variables: { 'urn:solid-on-rails:default:variable:modulePathPlaceholder': '@SoR:' }},
      );
      expect(cliExtractor.handleSafe).toHaveBeenCalledTimes(1);
      expect(cliExtractor.handleSafe).toHaveBeenCalledWith({
        argv: [ 'node', 'script', '--envVarPrefix=CUSTOM_ENV_PREFIX' ],
        envVarPrefix: 'CUSTOM_ENV_PREFIX',
      });
      expect(settingsResolver.handleSafe).toHaveBeenCalledTimes(1);
      expect(settingsResolver.handleSafe).toHaveBeenCalledWith(defaultParameters);
      expect(manager.instantiate).toHaveBeenNthCalledWith(2,
        'urn:solid-on-rails:default:App',
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

    it('throws an error if the server could not start.', async(): Promise<void> => {
      app.start.mockRejectedValueOnce(new Error('Fatal'));

      let caughtError: Error = new Error('should disappear');
      try {
        await new AppRunner().runCli([ 'node', 'script' ]);
      } catch (error: unknown) {
        caughtError = error as Error;
      }
      expect(caughtError.message).toMatch(/^Could not start the server/mu);
      expect(caughtError.message).toMatch(/^Cause: Fatal/mu);

      expect(app.start).toHaveBeenCalledTimes(1);

      expect(write).toHaveBeenCalledTimes(0);

      expect(exit).toHaveBeenCalledTimes(0);
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

      await expect(new AppRunner().runCli()).resolves.toBeUndefined();

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
        'urn:solid-on-rails-setup:default:CliResolver',
        { variables: { 'urn:solid-on-rails:default:variable:modulePathPlaceholder': '@SoR:' }},
      );
      expect(cliExtractor.handleSafe).toHaveBeenCalledTimes(1);
      expect(cliExtractor.handleSafe).toHaveBeenCalledWith({ argv: argvParameters, envVarPrefix: '' });
      expect(settingsResolver.handleSafe).toHaveBeenCalledTimes(1);
      expect(settingsResolver.handleSafe).toHaveBeenCalledWith(defaultParameters);
      expect(manager.instantiate).toHaveBeenNthCalledWith(2,
        'urn:solid-on-rails:default:App',
        { variables: defaultVariables });
      expect(app.start).toHaveBeenCalledTimes(1);
      expect(app.start).toHaveBeenLastCalledWith();

      process.argv = argv;
    });
  });

  describe('runCliSync', (): void => {
    it('starts the server.', async(): Promise<void> => {
      // eslint-disable-next-line no-sync
      new AppRunner().runCliSync({ argv: [ 'node', 'script' ]});

      // Wait until app.start has been called, because we can't await AppRunner.run.
      await flushPromises();

      expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
      expect(ComponentsManager.build).toHaveBeenCalledWith({
        dumpErrorState: true,
        logLevel: 'info',
        mainModulePath: joinFilePath(__dirname, '../../../'),
      });
      expect(manager.configRegistry.register).toHaveBeenCalledTimes(1);
      expect(manager.configRegistry.register)
        .toHaveBeenCalledWith(joinFilePath(__dirname, '/../../../config/default.json'));
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
        'urn:solid-on-rails:default:App',
        { variables: defaultVariables });
      expect(app.start).toHaveBeenCalledTimes(1);
      expect(app.start).toHaveBeenLastCalledWith();
    });

    it('exits the process and writes to stderr if there was an error.', async(): Promise<void> => {
      manager.instantiate.mockRejectedValueOnce(new Error('Fatal'));

      // eslint-disable-next-line no-sync
      new AppRunner().runCliSync({ argv: [ 'node', 'script' ]});

      // Wait until app.start has been called, because we can't await AppRunner.runCli.
      await flushPromises();

      expect(write).toHaveBeenCalledTimes(1);
      expect(write).toHaveBeenLastCalledWith(expect.stringMatching(/Cause: Fatal/mu));

      expect(exit).toHaveBeenCalledTimes(1);
      expect(exit).toHaveBeenLastCalledWith(1);
    });
  });
});
