import { ComponentsManager } from 'componentsjs';
import type { IComponentsManagerBuilderOptions } from 'componentsjs';
import type yargs from 'yargs';
import type { CliResolver } from '../init/CliResolver';
import type { CliArgv, VariableBindings } from '../init/variables/Types';
import type { LogLevel } from '../logging/LogLevel';
import { resolveError } from './errors/ErrorUtil';
import { PlaceholderPathResolver } from './path/PlaceholderPathResolver';

export const DEFAULT_CLI_RESOLVER = 'urn:solid-on-rails-setup:default:CliResolver';

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
}

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
 * Creates the Components Manager that will be used for instantiating. Throws
 * an error with the Yargs help if it fails.
 */
async function createComponentsManagerOrResolveError<T>(
  componentsManagerOptions: IComponentsManagerBuilderOptions<T>,
  configFile: string,
): Promise<ComponentsManager<T>> {
  try {
    return await createComponentsManager<T>(componentsManagerOptions, configFile);
  } catch (error: unknown) {
    resolveError(`Could not build the config files from ${configFile}`, error);
  }
}

export async function createComponentsManagerSetupFromCliArgs(
  params: CliParameters,
  argv: CliArgv,
): Promise<ComponentsManagerSetup> {
  // Could make this initialized via components js?
  const pathResolver = new PlaceholderPathResolver(params.modulePathPlaceholder);

  const componentsManagerOptions = {
    mainModulePath: pathResolver.resolveAssetPath(params.mainModulePath),
    dumpErrorState: true,
    logLevel: params.loggingLevel,
    typeChecking: false,
  };

  const config = pathResolver.resolveAssetPath(params.config);

  // Create the Components.js manager used to build components from the provided config
  const componentsManager = await createComponentsManagerOrResolveError<any>(
    componentsManagerOptions,
    config,
  );

  // Build the CLI components and use them to generate values for the Components.js variables
  const variables = await resolveVariables(componentsManager, argv, params);
  return { variables, componentsManager };
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
