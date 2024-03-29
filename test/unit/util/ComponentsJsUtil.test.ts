/* eslint-disable @typescript-eslint/naming-convention */
import { ComponentsManager } from 'componentsjs';
import type { IComponentsManagerBuilderOptions } from 'componentsjs';
import type { CliExtractor } from '../../../src/init/cli/CliExtractor';
import type { SettingsResolver } from '../../../src/init/variables/SettingsResolver';
import type { CliParameters } from '../../../src/util/ComponentsJsUtil';
import {
  createComponentsManagerSetupFromCliArgs,
  instantiateWithManagerAndVariables,
  createComponentsManager,
} from '../../../src/util/ComponentsJsUtil';
import { joinFilePath } from '../../../src/util/PathUtil';

const variables = {};

const parameters = {};

const instantiatedThing = {};

const cliExtractor: jest.Mocked<CliExtractor> = {
  handleSafe: jest.fn().mockResolvedValue(parameters),
} as any;

const settingsResolver: jest.Mocked<SettingsResolver> = {
  handleSafe: jest.fn().mockResolvedValue(variables),
} as any;

const manager: jest.Mocked<ComponentsManager<Record<string, any>>> = {
  instantiate: jest.fn(async(iri: string): Promise<any> => {
    switch (iri) {
      case 'urn:solid-on-rails-setup:default:CliResolver': return { cliExtractor, settingsResolver };
      case 'urn:solid-on-rails:test:Thing': return instantiatedThing;
      default: throw new Error('unknown iri');
    }
  }),
  configRegistry: {
    register: jest.fn(),
  },
} as any;

jest.mock('componentsjs', (): any => ({
  ComponentsManager: {
    build: jest.fn(async(): Promise<ComponentsManager<any>> => manager),
  },
}));

jest.spyOn(process, 'cwd').mockReturnValue('/var/cwd');
const write = jest.spyOn(process.stderr, 'write').mockImplementation(jest.fn());
const exit = jest.spyOn(process, 'exit').mockImplementation(jest.fn() as any);

describe('ComponentsJsUtil', (): void => {
  afterEach((): void => {
    jest.clearAllMocks();
  });

  describe('#createComponentsManager', (): void => {
    it('creates a ComponentsManager configured wit the configFile.', async(): Promise<void> => {
      const options = {} as IComponentsManagerBuilderOptions<any>;
      await expect(createComponentsManager(options, './config.json')).resolves.toBe(manager);
      expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
      expect(ComponentsManager.build).toHaveBeenCalledWith(options);
      expect(manager.configRegistry.register).toHaveBeenCalledWith('./config.json');
    });
  });

  describe('#createComponentsManagerSetupFromCliArgs', (): void => {
    let params: CliParameters;

    beforeEach(async(): Promise<void> => {
      params = {
        config: './config.json',
        loggingLevel: 'info',
        mainModulePath: undefined,
        modulePathPlaceholder: '@SoR',
        envVarPrefix: '',
      };
    });

    it('returns the variables, parameters, and components manager configured with the cli args.',
      async(): Promise<void> => {
        await expect(createComponentsManagerSetupFromCliArgs(
          params,
          [ 'node', 'script' ],
        )).resolves.toEqual(
          expect.objectContaining({ variables, componentsManager: manager }),
        );
        expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
        expect(ComponentsManager.build).toHaveBeenCalledWith({
          dumpErrorState: true,
          logLevel: 'info',
          mainModulePath: joinFilePath(__dirname, '../../../'),
          typeChecking: false,
        });
        expect(manager.configRegistry.register).toHaveBeenCalledWith('/var/cwd/config.json');
        expect(cliExtractor.handleSafe).toHaveBeenCalledTimes(1);
        expect(cliExtractor.handleSafe).toHaveBeenCalledWith({ argv: [ 'node', 'script' ], envVarPrefix: '' });
        expect(settingsResolver.handleSafe).toHaveBeenCalledTimes(1);
        expect(settingsResolver.handleSafe).toHaveBeenCalledWith(parameters);
      });

    it('throws an error if componentsjs failed to build.', async(): Promise<void> => {
      (ComponentsManager.build as jest.Mock).mockRejectedValueOnce(new Error('Fatal'));

      let caughtError: Error = new Error('should disappear');
      try {
        await createComponentsManagerSetupFromCliArgs(params, [ 'node', 'script' ]);
      } catch (error: unknown) {
        caughtError = error as Error;
      }
      expect(caughtError.message).toMatch(/^Could not build the config files from/mu);
      expect(caughtError.message).toMatch(/^Cause: Fatal/mu);
      expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
      expect(write).toHaveBeenCalledTimes(0);
      expect(exit).toHaveBeenCalledTimes(0);
    });

    it('throws an error if the variables could not be loaded.', async(): Promise<void> => {
      settingsResolver.handleSafe.mockRejectedValueOnce(new Error('Fatal'));

      let caughtError: Error = new Error('should disappear');
      try {
        await createComponentsManagerSetupFromCliArgs(params, [ 'node', 'script' ]);
      } catch (error: unknown) {
        caughtError = error as Error;
      }

      expect(caughtError.message).toMatch(/^Could not load the config variables/mu);
      expect(caughtError.message).toMatch(/^Cause: Fatal/mu);
    });
  });

  describe('#instantiateWithManagerAndVariables', (): void => {
    it('returns the instantiated instance.', async(): Promise<void> => {
      await expect(instantiateWithManagerAndVariables(
        'urn:solid-on-rails:test:Thing',
        manager,
        variables,
      )).resolves.toBe(instantiatedThing);
      expect(manager.instantiate).toHaveBeenCalledTimes(1);
      expect(manager.instantiate).toHaveBeenCalledWith(
        'urn:solid-on-rails:test:Thing',
        { variables },
      );
    });

    it('throws an error if instantiation fails.', async(): Promise<void> => {
      manager.instantiate.mockRejectedValueOnce(new Error('Componentsjs failed to instantiate.'));

      let caughtError: Error = new Error('should disappear');
      try {
        await instantiateWithManagerAndVariables(
          'urn:solid-on-rails:test:Thing',
          manager,
          variables,
          'Could not create the thing',
        );
      } catch (error: unknown) {
        caughtError = error as Error;
      }
      expect(caughtError.message).toMatch(/^Could not create the thing/mu);
      expect(caughtError.message).toMatch(/^Cause: Componentsjs failed to instantiate/mu);
      expect(manager.instantiate).toHaveBeenCalledTimes(1);
      expect(manager.instantiate).toHaveBeenCalledWith(
        'urn:solid-on-rails:test:Thing',
        { variables },
      );
    });
  });
});
