import type { IComponentsManagerBuilderOptions } from 'componentsjs';
import { getLoggerFor } from '../logging/LogUtil';
import type { CliParameters } from '../util/ComponentsJsUtil';
import {
  createComponentsManagerSetupFromCliArgs,
  instantiateWithManagerAndVariables,
  createComponentsManager,
} from '../util/ComponentsJsUtil';
import { resolveError, createErrorMessage } from '../util/errors/ErrorUtil';
import type { App } from './App';
import type { CliArgv, VariableBindings } from './variables/Types';

const INSTANTIATION_ERROR_MESSAGE = 'Could not create the server';
const DEFAULT_APP = 'urn:solid-on-rails:default:App';

/**
 * A class that can be used to instantiate and start a server based on a Component.js configuration.
 */
export class AppRunner {
  private readonly logger = getLoggerFor(this);
  /**
   * Starts the server with a given config.
   * This method can be used to start the server from within another JavaScript application.
   * Keys of the `variableBindings` object should be Components.js variables.
   * E.g.: `{ 'urn:solid-on-rails:default:variable:loggingLevel': 'info', }`.
   *
   * @param componentsManagerOptions - Components.js manager options.
   * @param configFile - Path to the server config file.
   * @param variableBindings - Parameters to pass into the VariableResolver.
   */
  public async run(
    componentsManagerOptions: IComponentsManagerBuilderOptions<App>,
    configFile: string,
    variableBindings: VariableBindings,
  ): Promise<void> {
    const componentsManager = await createComponentsManager<App>(componentsManagerOptions, configFile);
    const app = await instantiateWithManagerAndVariables<App>(
      DEFAULT_APP,
      componentsManager,
      variableBindings,
      INSTANTIATION_ERROR_MESSAGE,
    );
    await app.start();
  }

  /**
   * Starts the server as a command-line application.
   * @param params - The core parameters supplied via the command line.
   * @param argv - Command line arguments.
   */
  public async runCli(
    params: CliParameters,
    argv: CliArgv = process.argv,
  ): Promise<void> {
    const { variables, componentsManager } = await createComponentsManagerSetupFromCliArgs(params, argv);
    const app = await instantiateWithManagerAndVariables<App>(
      DEFAULT_APP,
      componentsManager,
      variables,
      INSTANTIATION_ERROR_MESSAGE,
    );

    try {
      await app.start();
    } catch (error: unknown) {
      // Need to set up logger
      this.logger.error(`Could not start the server: ${createErrorMessage(error)}`);
      resolveError('Could not start the server', error);
    }
  }
}
