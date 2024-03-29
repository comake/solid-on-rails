import type { CliArgv } from '../init/variables/Types';
import type { QueueAdapter } from '../jobs/adapter/QueueAdapter';
import { getLoggerFor } from '../logging/LogUtil';
import type { CliParameters } from '../util/ComponentsJsUtil';
import type { AsyncronousAppRunnerCallbackArgs } from './AsyncronousAppAccessorRunner';
import { AsyncronousAppAccessorRunner } from './AsyncronousAppAccessorRunner';

/**
 * A class that can be used to instantiate and start a server based on a Component.js configuration.
 */
export class QueueAdapterAccessorRunner extends AsyncronousAppAccessorRunner {
  protected readonly instantiationErrorMessage = 'Could not create the queue adapter';
  protected readonly defaultInstancesUri = 'urn:solid-on-rails:queue-accessor:Instances';
  protected readonly logger = getLoggerFor(this);

  public async deleteAllQueues(
    params: CliParameters,
    argv: CliArgv,
  ): Promise<void> {
    const callback = async({ instances: { queueAdapter }}: AsyncronousAppRunnerCallbackArgs): Promise<void> => {
      this.logger.info('Deleting all queues');
      await queueAdapter.deleteAllQueues();
      this.logger.info('Successfully deleted all queues.');
    };
    await this.runAppAndExecuteCallbackWithInstancesAndEnv(params, argv, callback);
  }

  public async deleteQueue(
    params: CliParameters,
    argv: CliArgv,
  ): Promise<void> {
    const callback = async({ instances: { queueAdapter }}: AsyncronousAppRunnerCallbackArgs): Promise<void> => {
      const indexOfQueuesDeleteCommand = argv.indexOf('queues:delete');
      const queueName = argv[indexOfQueuesDeleteCommand + 1];
      this.logger.info(`Deleting this ${queueName} queue`);
      await queueAdapter.deleteQueue(queueName);
      this.logger.info(`Successfully deleted the ${queueName} queue.`);
    };
    await this.runAppAndExecuteCallbackWithInstancesAndEnv(params, argv, callback);
  }

  public async removeCompletedInQueue(
    params: CliParameters,
    argv: CliArgv,
  ): Promise<void> {
    const callback = async({ instances: { queueAdapter }}: AsyncronousAppRunnerCallbackArgs): Promise<void> => {
      const indexOfQueuesDeleteCommand = argv.indexOf('queues:removeCompleted');
      const queueName = argv[indexOfQueuesDeleteCommand + 1];
      this.logger.info(`Removing completed in the ${queueName} queue`);
      await (queueAdapter as QueueAdapter).removeCompletedInQueue(queueName);
      this.logger.info(`Successfully removed completed in the ${queueName} queue.`);
    };
    await this.runAppAndExecuteCallbackWithInstancesAndEnv(params, argv, callback);
  }
}
