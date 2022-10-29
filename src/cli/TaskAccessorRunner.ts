/* eslint-disable
  global-require,
  @typescript-eslint/no-require-imports,
  @typescript-eslint/no-var-requires
*/
import type { CliArgv } from '../init/variables/Types';
import { getLoggerFor } from '../logging/LogUtil';
import type { CliParameters } from '../util/ComponentsJsUtil';
import { absoluteFilePath } from '../util/PathUtil';
import type { AsyncronousAppRunnerCallbackArgs } from './AsyncronousAppAccessorRunner';
import { AsyncronousAppAccessorRunner } from './AsyncronousAppAccessorRunner';

/**
 * A class that can be used to instantiate and start a server based on a Component.js configuration.
 */
export class TaskAccessorRunner extends AsyncronousAppAccessorRunner {
  protected readonly instantiationErrorMessage = 'Could not create the storages';
  protected readonly defaultInstancesUri = 'urn:solid-on-rails:task-accessor:Instances';
  protected readonly logger = getLoggerFor(this);

  public async runTask(params: CliParameters, argv: CliArgv): Promise<void> {
    const callback = async(args: AsyncronousAppRunnerCallbackArgs): Promise<void> => {
      const indexOfTaskCommand = argv.indexOf('task');
      const taskName = argv[indexOfTaskCommand + 1];
      this.logger.info(`Running task ${taskName}`);
      const taskFile = absoluteFilePath(`./tasks/${taskName}.js`);
      const taskFunction = require(taskFile);
      await taskFunction(args);
      this.logger.info('Successfully executed task');
    };
    await this.runAppAndExecuteCallbackWithInstancesAndEnv(params, argv, callback);
  }
}
