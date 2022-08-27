/* eslint-disable unicorn/no-process-exit */
import * as dotenv from 'dotenv';
import { getLoggerFor } from '../logging/LogUtil';
import {
  createComponentsManagerSetupFromCliArgs,
  instantiateWithManagerAndVariables,
  CORE_CLI_PARAMETERS,
} from '../util/ComponentsJsUtil';
import type { CliParametersConfig, IRunCliSyncOptions } from '../util/ComponentsJsUtil';
import { createErrorMessage, resolveError } from '../util/errors/ErrorUtil';
import { resolveModulePath } from '../util/PathUtil';
import type { CliArgv } from './variables/Types';

// See https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

const INSTANTIATION_ERROR_MESSAGE = 'Could not create the queue adapter';
const DEFAULT_CONFIG = resolveModulePath('config/default-queue-accessor.json');
const DEFAULT_INSTANCES = 'urn:skl-app-server:storage-accessor:Instances';

const QUEUE_ADAPTER_ACCESSOR_CLI_PARAMETERS = {
  ...CORE_CLI_PARAMETERS,
  config: { type: 'string', alias: 'c', default: DEFAULT_CONFIG, requiresArg: true },
} as CliParametersConfig;

/**
 * A class that can be used to instantiate and start a server based on a Component.js configuration.
 */
export class QueueAdapterAccessorRunner {
  private readonly logger = getLoggerFor(this);
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
  public async run(options: IRunCliSyncOptions): Promise<Record<string, any>> {
    const { argv, stderr = process.stderr } = options;
    try {
      return await this.runCli(argv);
    } catch (error: unknown) {
      stderr.write(createErrorMessage(error));
      process.exit(1);
    }
  }

  /**
   * Starts the server as a command-line application.
   * @param argv - Command line arguments.
   */
  private async runCli(argv: CliArgv = process.argv): Promise<Record<string, any>> {
    const { variables, parameters, componentsManager } = await createComponentsManagerSetupFromCliArgs(
      argv,
      QUEUE_ADAPTER_ACCESSOR_CLI_PARAMETERS,
    );

    const instances = await instantiateWithManagerAndVariables<Record<string, any>>(
      DEFAULT_INSTANCES,
      componentsManager,
      variables,
      INSTANTIATION_ERROR_MESSAGE,
    );

    try {
      await instances.app.start();
    } catch (error: unknown) {
      // Need to set up logger
      this.logger.error(`${INSTANTIATION_ERROR_MESSAGE}: ${createErrorMessage(error)}`);
      resolveError(INSTANTIATION_ERROR_MESSAGE, error);
    }

    return { ...instances, env: parameters };
  }
}
