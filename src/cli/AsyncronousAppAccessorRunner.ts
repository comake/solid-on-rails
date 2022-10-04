import type { CliArgv } from '../init/variables/Types';
import type { Logger } from '../logging/Logger';
import type { CliParameters } from '../util/ComponentsJsUtil';
import {
  createComponentsManagerSetupFromCliArgs,
  instantiateWithManagerAndVariables,
} from '../util/ComponentsJsUtil';
import { createErrorMessage, resolveError } from '../util/errors/ErrorUtil';

export interface AsyncronousAppRunnerCallbackArgs {
  instances: Record<string, any>;
  env: CliParameters;
}

export abstract class AsyncronousAppAccessorRunner {
  protected abstract readonly instantiationErrorMessage: string;
  protected abstract readonly defaultInstancesUri: string;
  protected abstract readonly logger: Logger;

  /**
   * Starts the server as a command-line application and runs a callback with
   * the instances and environment. Will exit the process on failure.
   *
   * Made non-async to lower the risk of unhandled promise rejections.
   * This is only relevant when this is used to start as a Node.js application on its own,
   * if you use this as part of your code you probably want to use the async version.
   *
   * @param params - The parameters that were included on the command line
   * @param argv - A list of command line arguments provided to the process
   * @param callback - The callback to execute against the configured instances and environment
   */
  public async runAppAndExecuteCallbackWithInstancesAndEnv(
    params: CliParameters,
    argv: CliArgv,
    callback: (args: AsyncronousAppRunnerCallbackArgs) => Promise<void>,
  ): Promise<void> {
    const { variables, componentsManager } = await createComponentsManagerSetupFromCliArgs(params, argv);

    const instances = await instantiateWithManagerAndVariables<Record<string, any>>(
      this.defaultInstancesUri,
      componentsManager,
      variables,
      this.instantiationErrorMessage,
    );

    const { app, ...otherInstances } = instances;
    try {
      await app.start();
      // eslint-disable-next-line callback-return
      await callback({ instances: otherInstances, env: params });
    } catch (error: unknown) {
      this.logger.error(`${this.instantiationErrorMessage}: ${createErrorMessage(error)}`);
      resolveError(this.instantiationErrorMessage, error);
    } finally {
      await app.stop();
    }
  }
}
