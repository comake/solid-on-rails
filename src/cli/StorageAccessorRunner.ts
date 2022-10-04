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
export class StorageAccessorRunner extends AsyncronousAppAccessorRunner {
  protected readonly instantiationErrorMessage = 'Could not create the storages';
  protected readonly defaultInstancesUri = 'urn:solid-on-rails:storage-accessor:Instances';
  protected readonly logger = getLoggerFor(this);

  public async seedStorages(params: CliParameters, argv: CliArgv): Promise<void> {
    const callback = async(args: AsyncronousAppRunnerCallbackArgs): Promise<void> => {
      this.logger.info('Running seeds');
      const seedsFile = absoluteFilePath('./db/seeds.js');
      const seedsFunction = require(seedsFile);
      await seedsFunction(args);
      this.logger.info('Successfully executed seeds');
    };
    await this.runAppAndExecuteCallbackWithInstancesAndEnv(params, argv, callback);
  }

  public async dropStorages(params: CliParameters, argv: CliArgv): Promise<void> {
    const callback = async(
      { instances: { dataMapper, keyValue }}: AsyncronousAppRunnerCallbackArgs,
    ): Promise<void> => {
      this.logger.info('Running drop storages');
      await dataMapper.initialize();
      await dataMapper.dropDatabase();
      this.logger.info('Successfully dropped Data Mapper database.');

      // Delete all keys in Key Value storage
      const keys = [];
      for await (const entry of keyValue.entries()) {
        keys.push(entry[0]);
      }
      await Promise.all(keys.map((key): Promise<void> => keyValue.delete(key)));
      this.logger.info('Successfully deleted all keys from Key Value Storage.');
    };
    await this.runAppAndExecuteCallbackWithInstancesAndEnv(params, argv, callback);
  }

  public async setupDatabase(params: CliParameters, argv: CliArgv): Promise<void> {
    const callback = async({ instances: { dataMapper }}: AsyncronousAppRunnerCallbackArgs): Promise<void> => {
      this.logger.info('Setting up database from entity schemas');
      await dataMapper.initialize();
      await dataMapper.setupDatabase();
      this.logger.info('Successfully setup database');
    };
    await this.runAppAndExecuteCallbackWithInstancesAndEnv(params, argv, callback);
  }

  public async runPendingMigrations(params: CliParameters, argv: CliArgv): Promise<void> {
    const callback = async({ instances: { dataMapper }}: AsyncronousAppRunnerCallbackArgs): Promise<void> => {
      this.logger.info('Running pending migrations');
      await dataMapper.initialize();
      await dataMapper.runPendingMigrations();
      this.logger.info('Successfully run migrations');
    };
    await this.runAppAndExecuteCallbackWithInstancesAndEnv(params, argv, callback);
  }

  public async revertLastMigration(params: CliParameters, argv: CliArgv): Promise<void> {
    const callback = async({ instances: { dataMapper }}: AsyncronousAppRunnerCallbackArgs): Promise<void> => {
      this.logger.info('Reverting last executed migration');
      await dataMapper.initialize();
      await dataMapper.revertLastMigration();
      this.logger.info('Successfully reverted the last migration');
    };
    await this.runAppAndExecuteCallbackWithInstancesAndEnv(params, argv, callback);
  }
}
