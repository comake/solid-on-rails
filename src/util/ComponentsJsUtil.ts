import type { WriteStream } from 'tty';
import { ComponentsManager } from 'componentsjs';
import type { IComponentsManagerBuilderOptions } from 'componentsjs';
import yargs from 'yargs';
import type { CliResolver } from '../init/CliResolver';
import type { CliArgv, VariableBindings } from '../init/variables/Types';
import { LOG_LEVELS } from '../logging/LogLevel';
import type { LogLevel } from '../logging/LogLevel';
import { resolveError } from './errors/ErrorUtil';
import { PlaceholderPathResolver } from './path/PlaceholderPathResolver';

export type Yargv<T extends Record<string, any>> = yargs.Argv<
Omit<Record<string, unknown>, keyof T> &
yargs.InferredOptionTypes<T>
>;

export type CliParameters = {
  config: string;
  loggingLevel: LogLevel;
  mainModulePath: string | undefined;
  modulePathPlaceholder: string;
  envVarPrefix: string;
  [k: string]: unknown;
};

export interface ComponentsManagerSetup {
  variables: VariableBindings;
  componentsManager: ComponentsManager<any>;
  parameters: Record<string, any>;
}

export interface IRunCliSyncOptions {
  argv?: CliArgv;
  stderr?: WriteStream;
}

export const DEFAULT_CLI_RESOLVER = 'urn:solid-on-rails-setup:default:CliResolver';
export const DEFAULT_MODULE_PATH_PLACEHOLDER = '@SoR:';
export const DEFAULT_ENV_VAR_PREFIX = '';

export const CORE_CLI_PARAMETERS = {
  loggingLevel: { type: 'string', alias: 'l', default: 'info', requiresArg: true, choices: LOG_LEVELS },
  mainModulePath: { type: 'string', alias: 'm', requiresArg: true },
  modulePathPlaceholder: { type: 'string', alias: 'o', default: DEFAULT_MODULE_PATH_PLACEHOLDER, requiresArg: true },
  envVarPrefix: { type: 'string', alias: 'v', default: DEFAULT_ENV_VAR_PREFIX, requiresArg: true },
} as const;

export type CliParametersConfig = typeof CORE_CLI_PARAMETERS & {
  readonly config: {
    readonly type: 'string';
    readonly alias: 'c';
    readonly default: string;
    readonly requiresArg: true;
  };
};

/**
 * Creates the Components Manager that will be used for instantiating.
 */
export async function createComponentsManager<T>(
  componentsManagerOptions: IComponentsManagerBuilderOptions<T>,
  configFile: string,
): Promise<ComponentsManager<T>> {
  const componentsManager = await ComponentsManager.build(componentsManagerOptions);
  await componentsManager.configRegistry.register(configFile);
  return componentsManager;
}

/**
  * Creates the Components Manager that will be used for instantiating. Throws
  * an error with the Yargs help if it fails.
  */
async function createComponentsManagerOrDisplayHelp<T>(
  componentsManagerOptions: IComponentsManagerBuilderOptions<T>,
  configFile: string,
  yargv: Yargv<typeof CORE_CLI_PARAMETERS>,
): Promise<ComponentsManager<T>> {
  try {
    return await createComponentsManager<T>(componentsManagerOptions, configFile);
  } catch (error: unknown) {
    // Print help of the expected core CLI parameters
    const help = await yargv.getHelp();
    resolveError(`${help}\n\nCould not build the config files from ${configFile}`, error);
  }
}

/**
 * Performs the first Components.js instantiation,
 * where CLI settings and variable mappings are created.
 */
async function resolveVariables(
  componentsManager: ComponentsManager<CliResolver>,
  argv: string[],
  parameters: CliParameters,
): Promise<VariableBindings> {
  try {
    // Create a CliResolver, which combines a CliExtractor and a VariableResolver
    const resolver = await componentsManager.instantiate(DEFAULT_CLI_RESOLVER, {
      variables: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        'urn:solid-on-rails:default:variable:modulePathPlaceholder': parameters.modulePathPlaceholder,
      },
    });
    // Convert CLI args to CLI bindings
    const cliValues = await resolver.cliExtractor.handleSafe({ argv, envVarPrefix: parameters.envVarPrefix });
    // Convert CLI bindings into variable bindings
    return await resolver.settingsResolver.handleSafe(cliValues);
  } catch (error: unknown) {
    resolveError(`Could not load the config variables`, error);
  }
}

/**
 * Parses the core CLI arguments needed to load the configuration. First parses for
 * just the envVarPrefix, then again to get all the core CLI args and env vars.
 */
async function parseCliArgs(
  argv: CliArgv,
  cliParameters: CliParametersConfig,
): Promise<{ params: CliParameters; yargv: Yargv<typeof cliParameters> }> {
  // Parse only the envVarPrefix CLI argument
  const { envVarPrefix } = await yargs(argv.slice(2))
    .usage('node ./bin/server.js [args]')
    .options({ envVarPrefix: cliParameters.envVarPrefix })
    .argv;

  // Parse the core CLI arguments needed to load the configuration
  const yargv = yargs(argv.slice(2))
    .usage('node ./bin/server.js [args]')
    .options(cliParameters)
    // Disable help as it would only show the core parameters
    .help(false)
    // Read from environment variables
    .env(envVarPrefix);

  const params = await yargv.parse();
  return { params, yargv };
}

export async function createComponentsManagerSetupFromCliArgs(
  argv: CliArgv,
  cliParameters: CliParametersConfig,
): Promise<ComponentsManagerSetup> {
  const { params, yargv } = await parseCliArgs(argv, cliParameters);
  // Could make this initialized via components js?
  const pathResolver = new PlaceholderPathResolver(params.modulePathPlaceholder);

  const componentsManagerOptions = {
    mainModulePath: pathResolver.resolveAssetPath(params.mainModulePath),
    dumpErrorState: true,
    logLevel: params.loggingLevel,
  };

  const config = pathResolver.resolveAssetPath(params.config);

  // Create the Components.js manager used to build components from the provided config
  const componentsManager = await createComponentsManagerOrDisplayHelp<any>(
    componentsManagerOptions,
    config,
    yargv,
  );

  // Build the CLI components and use them to generate values for the Components.js variables
  const variables = await resolveVariables(componentsManager, argv, params);
  return { variables, parameters: params, componentsManager };
}

/**
 * The second Components.js instantiation,
 * where the App is created and started using the variable mappings.
 */
export async function instantiateWithManagerAndVariables<T>(
  instanceIri: string,
  componentsManager: ComponentsManager<T>,
  variables: Record<string, unknown>,
  errorMessage = 'Could not create instance',
): Promise<T> {
  try {
    return await componentsManager.instantiate<T>(instanceIri, { variables });
  } catch (error: unknown) {
    resolveError(errorMessage, error);
  }
}
