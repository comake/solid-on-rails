/* eslint-disable unicorn/no-process-exit */
import type { WriteStream } from 'tty';
import { ComponentsManager } from 'componentsjs';
import type { IComponentsManagerBuilderOptions } from 'componentsjs';
import yargs from 'yargs';
import { LOG_LEVELS } from '../logging/LogLevel';
import type { LogLevel } from '../logging/LogLevel';
import { getLoggerFor } from '../logging/LogUtil';
import { createErrorMessage, isError } from '../util/errors/ErrorUtil';
import { PlaceholderPathResolver } from '../util/path/PlaceholderPathResolver';
import { resolveModulePath } from '../util/PathUtil';
import type { App } from './App';
import type { CliResolver } from './CliResolver';
import type { CliArgv, VariableBindings } from './variables/Types';

export type CliParameters = {
  config: string;
  loggingLevel: LogLevel;
  mainModulePath: string | undefined;
  modulePathPlaceholder: string;
  envVarPrefix: string;
  [k: string]: unknown;
};

export type Yargv<T extends Record<string, any>> = yargs.Argv<
Omit<Record<string, unknown>, keyof T> &
yargs.InferredOptionTypes<T>
>;

export interface IRunCliSyncOptions {
  argv?: CliArgv;
  stderr?: WriteStream;
}

const DEFAULT_CONFIG = resolveModulePath('config/default.json');
const DEFAULT_CLI_RESOLVER = 'urn:skl-app-server-setup:default:CliResolver';
const DEFAULT_APP = 'urn:skl-app-server:default:App';
const DEFAULT_MODULE_PATH_PLACEHOLDER = '@sklAppServer:';
const DEFAULT_ENV_VAR_PREFIX = '';

const CORE_CLI_PARAMETERS = {
  config: { type: 'string', alias: 'c', default: DEFAULT_CONFIG, requiresArg: true },
  loggingLevel: { type: 'string', alias: 'l', default: 'info', requiresArg: true, choices: LOG_LEVELS },
  mainModulePath: { type: 'string', alias: 'm', requiresArg: true },
  modulePathPlaceholder: { type: 'string', alias: 'o', default: DEFAULT_MODULE_PATH_PLACEHOLDER, requiresArg: true },
  envVarPrefix: { type: 'string', alias: 'v', default: DEFAULT_ENV_VAR_PREFIX, requiresArg: true },
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
   * E.g.: `{ 'urn:skl-app-server:default:variable:rootFilePath': '.data' }`.
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
    const componentsManager = await this.createComponentsManager<App>(componentsManagerOptions, configFile);
    const app = await this.createApp(componentsManager, variableBindings);
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
    const { params, yargv } = await this.parseCliArgs(argv);
    // Could make this initialized via components js?
    const pathResolver = new PlaceholderPathResolver(params.modulePathPlaceholder);

    const componentsManagerOptions = {
      mainModulePath: pathResolver.resolveAssetPath(params.mainModulePath),
      dumpErrorState: true,
      logLevel: params.loggingLevel,
    };

    const config = pathResolver.resolveAssetPath(params.config);

    // Create the Components.js manager used to build components from the provided config
    const componentsManager = await this.createComponentsManagerOrDisplayHelp<any>(
      componentsManagerOptions,
      config,
      yargv,
    );

    // Build the CLI components and use them to generate values for the Components.js variables
    const variables = await this.resolveVariables(componentsManager, argv, params.envVarPrefix);

    const app = await this.createApp(componentsManager, variables);

    try {
      await app.start();
    } catch (error: unknown) {
      // Need to set up logger
      this.logger.error(`Could not start the server: ${createErrorMessage(error)}`);
      this.resolveError('Could not start the server', error);
    }
  }

  /**
   * Creates the Components Manager that will be used for instantiating. Throws
   * an error with the Yargs help if it fails.
   */
  private async createComponentsManagerOrDisplayHelp<T>(
    componentsManagerOptions: IComponentsManagerBuilderOptions<T>,
    configFile: string,
    yargv: Yargv<typeof CORE_CLI_PARAMETERS>,
  ): Promise<ComponentsManager<T>> {
    try {
      return await this.createComponentsManager<T>(componentsManagerOptions, configFile);
    } catch (error: unknown) {
      // Print help of the expected core CLI parameters
      const help = await yargv.getHelp();
      this.resolveError(`${help}\n\nCould not build the config files from ${configFile}`, error);
    }
  }

  /**
   * Creates the Components Manager that will be used for instantiating.
   */
  private async createComponentsManager<T>(
    componentsManagerOptions: IComponentsManagerBuilderOptions<T>,
    configFile: string,
  ): Promise<ComponentsManager<T>> {
    const componentsManager = await ComponentsManager.build(componentsManagerOptions);
    await componentsManager.configRegistry.register(configFile);
    return componentsManager;
  }

  /**
   * Performs the first Components.js instantiation,
   * where CLI settings and variable mappings are created.
   */
  private async resolveVariables(
    componentsManager: ComponentsManager<CliResolver>,
    argv: string[],
    envVarPrefix: string,
  ): Promise<VariableBindings> {
    try {
      // Create a CliResolver, which combines a CliExtractor and a VariableResolver
      const resolver = await componentsManager.instantiate(DEFAULT_CLI_RESOLVER, {});
      // Convert CLI args to CLI bindings
      const cliValues = await resolver.cliExtractor.handleSafe({ argv, envVarPrefix });
      // Convert CLI bindings into variable bindings
      return await resolver.settingsResolver.handleSafe(cliValues);
    } catch (error: unknown) {
      this.resolveError(`Could not load the config variables`, error);
    }
  }

  /**
   * The second Components.js instantiation,
   * where the App is created and started using the variable mappings.
   */
  private async createApp(componentsManager: ComponentsManager<App>, variables: Record<string, unknown>): Promise<App> {
    try {
      // Create the app
      return await componentsManager.instantiate(DEFAULT_APP, { variables });
    } catch (error: unknown) {
      this.resolveError('Could not create the server', error);
    }
  }

  /**
   * Throws a new error that provides additional information through the extra message.
   * Also appends the stack trace to the message.
   * This is needed for errors that are thrown before the logger is created as we can't log those the standard way.
   */
  private resolveError(message: string, error: unknown): never {
    let errorMessage = `${message}\nCause: ${createErrorMessage(error)}\n`;
    if (isError(error)) {
      errorMessage += `${error.stack}\n`;
    }
    throw new Error(errorMessage);
  }

  /**
   * Parses the core CLI arguments needed to load the configuration. First parses for
   * just the envVarPrefix, then again to get all the core CLI args and env vars.
   */
  private async parseCliArgs(
    argv: CliArgv,
  ): Promise<{ params: CliParameters; yargv: Yargv<typeof CORE_CLI_PARAMETERS> }> {
    // Parse only the envVarPrefix CLI argument
    const { envVarPrefix } = await yargs(argv.slice(2))
      .usage('node ./bin/server.js [args]')
      .options({ envVarPrefix: CORE_CLI_PARAMETERS.envVarPrefix })
      .argv;

    // Parse the core CLI arguments needed to load the configuration
    const yargv = yargs(argv.slice(2))
      .usage('node ./bin/server.js [args]')
      .options(CORE_CLI_PARAMETERS)
      // Disable help as it would only show the core parameters
      .help(false)
      // Read from environment variables
      .env(envVarPrefix);

    const params = await yargv.parse();
    return { params, yargv };
  }
}
