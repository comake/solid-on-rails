/* eslint-disable unicorn/no-process-exit */
import type { WriteStream } from 'tty';
import * as dotenv from 'dotenv';
import yargs from 'yargs';
import { AppRunner } from '../init/AppRunner';
import type { CliArgv } from '../init/variables/Types';
import { LOG_LEVELS } from '../logging/LogLevel';
import type { CliParameters, Yargv } from '../util/ComponentsJsUtil';
import { createErrorMessage } from '../util/errors/ErrorUtil';
import { resolveModulePath } from '../util/PathUtil';
import { QueueAdapterAccessorRunner } from './QueueAdapterAccessorRunner';
import { StorageAccessorRunner } from './StorageAccessorRunner';
import { TaskRunner } from './TaskRunner';

// See https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();

export const DEFAULT_ENV_VAR_PREFIX = '';
export const DEFAULT_CONFIG = resolveModulePath('config/default.json');
export const DEFAULT_MODULE_PATH_PLACEHOLDER = '@SoR:';

export const CORE_CLI_PARAMETERS = {
  loggingLevel: { type: 'string', alias: 'l', default: 'info', requiresArg: true, choices: LOG_LEVELS },
  mainModulePath: { type: 'string', alias: 'm', requiresArg: true },
  modulePathPlaceholder: { type: 'string', alias: 'o', default: DEFAULT_MODULE_PATH_PLACEHOLDER, requiresArg: true },
  envVarPrefix: { type: 'string', alias: 'v', default: DEFAULT_ENV_VAR_PREFIX, requiresArg: true },
  config: { type: 'string', alias: 'c', default: DEFAULT_CONFIG, requiresArg: true },
} as const;

export type CliParametersConfig = typeof CORE_CLI_PARAMETERS;

export interface IRunCliSyncOptions {
  argv?: CliArgv;
  stderr?: WriteStream;
}

export class Cli {
  public runCliSync(options: IRunCliSyncOptions): void {
    const { argv = process.argv, stderr = process.stderr } = options;
    const { params, yargv } = this.parseCliArgs(argv, CORE_CLI_PARAMETERS);
    const command = (params._ as string[])[0];
    const asyncCommandProcess = !params.help && this.getAsyncProcessForCommand(command, params, argv);
    if (asyncCommandProcess) {
      asyncCommandProcess.catch((error): never => {
        stderr.write(createErrorMessage(error));
        process.exit(1);
      });
    } else {
      yargv.showHelp();
    }
  }

  /**
   * Parses the core CLI arguments needed to load the configuration. First parses for
   * just the envVarPrefix, then again to get all the core CLI args and env vars.
   */
  private parseCliArgs(
    argv: CliArgv,
    cliParameters: CliParametersConfig,
  ): { params: CliParameters; yargv: Yargv<CliParametersConfig> } {
    // Parse only the envVarPrefix CLI argument
    // eslint-disable-next-line no-sync
    const { envVarPrefix } = yargs(argv.slice(2))
      .options({ envVarPrefix: CORE_CLI_PARAMETERS.envVarPrefix })
      .help(false)
      .parseSync();
    // Parse the core CLI arguments needed to load the configuration
    const yargv = yargs(argv.slice(2))
      .usage('solid-on-rails [<command>]')
      .command('task', 'Run a task from the tasks folder')
      .command('storages:seed', 'Seed the storages from the ./db/seeds.js file')
      .command('storages:drop', 'Drop all data from the DataMapper and KeyValue Storages')
      .command('db:setup', 'Setup the database from configured entity schemas')
      .command('db:migrate', 'Run all pending migrations in the ./db/migrations folder')
      .command('db:revert', 'Revert the last executed migration')
      .command('queues:deleteAll', 'Delete all queues')
      .command('queues:delete', 'Delete a specific queue')
      .example('solid-on-rails storages:seed -c ./path/to/config.json -m .', 'Seed the storages with a custom config')
      .options(cliParameters)
      .wrap(120)
      .env(envVarPrefix);
    // eslint-disable-next-line no-sync
    const params = yargv.parseSync();
    return { params, yargv };
  }

  private getAsyncProcessForCommand(
    command: string | undefined,
    params: CliParameters,
    argv: CliArgv,
  ): Promise<void> | undefined {
    if (!command) {
      const appRunner = new AppRunner();
      return appRunner.runCli(params, argv);
    }
    if (command === 'task') {
      const runner = new TaskRunner();
      return runner.runTask(params, argv);
    }
    if (command === 'storages:seed') {
      const runner = new StorageAccessorRunner();
      return runner.seedStorages(params, argv);
    }
    if (command === 'storages:drop') {
      const runner = new StorageAccessorRunner();
      return runner.dropStorages(params, argv);
    }
    if (command === 'db:setup') {
      const runner = new StorageAccessorRunner();
      return runner.setupDatabase(params, argv);
    }
    if (command === 'db:migrate') {
      const runner = new StorageAccessorRunner();
      return runner.runPendingMigrations(params, argv);
    }
    if (command === 'db:revert') {
      const runner = new StorageAccessorRunner();
      return runner.revertLastMigration(params, argv);
    }
    if (command === 'queues:deleteAll') {
      const runner = new QueueAdapterAccessorRunner();
      return runner.deleteAllQueues(params, argv);
    }
    if (command === 'queues:delete') {
      const runner = new QueueAdapterAccessorRunner();
      return runner.deleteQueue(params, argv);
    }
  }
}
