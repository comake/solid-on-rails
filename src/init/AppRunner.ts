/* eslint-disable unicorn/no-process-exit */
import type { IComponentsManagerBuilderOptions } from 'componentsjs';
import * as dotenv from 'dotenv';
import { getLoggerFor } from '../logging/LogUtil';
import {
  createComponentsManagerSetupFromCliArgs,
  instantiateWithManagerAndVariables,
  createComponentsManager,
  CORE_CLI_PARAMETERS,
} from '../util/ComponentsJsUtil';
import type { IRunCliSyncOptions } from '../util/ComponentsJsUtil';
import { resolveError, createErrorMessage } from '../util/errors/ErrorUtil';
import { resolveModulePath } from '../util/PathUtil';
import type { App } from './App';
import type { CliArgv, VariableBindings } from './variables/Types';

// See https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

const INSTANTIATION_ERROR_MESSAGE = 'Could not create the server';
const DEFAULT_CONFIG = resolveModulePath('config/default.json');
const DEFAULT_APP = 'urn:solid-on-rails:default:App';

const APP_RUNNER_CLI_PARAMETERS = {
  ...CORE_CLI_PARAMETERS,
  config: { type: 'string', alias: 'c', default: DEFAULT_CONFIG, requiresArg: true },
} as const;

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
    const app = await instantiateWithManagerAndVariables(
      DEFAULT_APP,
      componentsManager,
      variableBindings,
      INSTANTIATION_ERROR_MESSAGE,
    );
    await app.start();
  }

  /**
   * Starts the server as a command-line application.
   * Will exit the process on failure.
   *
   * Made non-async to lower the risk of unhandled promise rejections.
   * This is only relevant when this is used to start as a Node.js application on its own,
   * if you use this as part of your code you probably want to use the async version.
   *
   * @param options - Object with:
   *    argv - Command line arguments and stderr
   *    stderr - Stream that should be used to output errors before the logger is enabled.
   */
  public runCliSync(options: IRunCliSyncOptions): void {
    const { argv, stderr = process.stderr } = options;
    this.runCli(argv).catch((error): never => {
      stderr.write(createErrorMessage(error));
      process.exit(1);
    });
  }

  /**
   * Starts the server as a command-line application.
   * @param argv - Command line arguments.
   */
  public async runCli(argv: CliArgv = process.argv): Promise<void> {
    const { variables, componentsManager } = await createComponentsManagerSetupFromCliArgs(
      argv,
      APP_RUNNER_CLI_PARAMETERS,
    );

    const app = await instantiateWithManagerAndVariables(
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
