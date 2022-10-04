/* eslint-disable max-len */
import { Cli } from '../../../src/cli/Cli';
import { QueueAdapterAccessorRunner } from '../../../src/cli/QueueAdapterAccessorRunner';
import { StorageAccessorRunner } from '../../../src/cli/StorageAccessorRunner';
import { AppRunner } from '../../../src/init/AppRunner';
import { flushPromises } from '../../util/Util';

jest.mock('../../../src/cli/QueueAdapterAccessorRunner');
jest.mock('../../../src/cli/StorageAccessorRunner');
jest.mock('../../../src/init/AppRunner');

const HELP_MESSAGE = `solid-on-rails [<command>]
    Commands:
      script storages:seed     Seed the storages from the ./db/seeds.js file
      script storages:drop     Drop all data from the DataMapper and KeyValue Storages
      script db:setup          Setup the database from configured entity schemas
      script db:migrate        Run all pending migrations in the ./db/migrations folder
      script db:revert         Revert the last executed migration
      script queues:deleteAll  Delete all queues
      script queues:delete     Delete a specific queue
    Options:
          --help                   Show help                                                                       [boolean]
          --version                Show version number                                                             [boolean]
      -l, --loggingLevel          [string] [choices: "error", "warn", "info", "verbose", "debug", "silly"] [default: "info"]
      -m, --mainModulePath                                                                                          [string]
      -o, --modulePathPlaceholder                                                                [string] [default: "@SoR:"]
      -v, --envVarPrefix                                                                              [string] [default: ""]
      -c, --config                             [string] [default: "/Users/adlerfaulkner/solid-on-rails/config/default.json"]
    Examples:
      solid-on-rails storages:seed -c ./path/to/config.json -m .  Seed the storages with a custom config`
  .replace(/\s+/ug, ` `);

describe('The Cli', (): void => {
  afterEach(async(): Promise<void> => {
    jest.clearAllMocks();
  });

  it('runs the storages:seed command.', async(): Promise<void> => {
    const seedStorages = jest.fn().mockReturnValue(Promise.resolve());
    (StorageAccessorRunner as jest.Mock).mockImplementation((): any => ({ seedStorages }));
    // eslint-disable-next-line no-sync
    new Cli().runCliSync({ argv: [ 'node', 'script', 'storages:seed' ]});
    // Wait until app.start has been called, because we can't await AppRunner.run.
    await flushPromises();
    expect(StorageAccessorRunner).toHaveBeenCalledTimes(1);
    expect(seedStorages).toHaveBeenCalledTimes(1);
    expect(seedStorages).toHaveBeenCalledWith(
      expect.objectContaining({
        loggingLevel: 'info',
      }),
      [ 'node', 'script', 'storages:seed' ],
    );
  });

  it('runs the storages:drop command.', async(): Promise<void> => {
    const dropStorages = jest.fn().mockReturnValue(Promise.resolve());
    (StorageAccessorRunner as jest.Mock).mockImplementation((): any => ({ dropStorages }));
    // eslint-disable-next-line no-sync
    new Cli().runCliSync({ argv: [ 'node', 'script', 'storages:drop' ]});
    // Wait until app.start has been called, because we can't await AppRunner.run.
    await flushPromises();
    expect(StorageAccessorRunner).toHaveBeenCalledTimes(1);
    expect(dropStorages).toHaveBeenCalledTimes(1);
    expect(dropStorages).toHaveBeenCalledWith(
      expect.objectContaining({
        loggingLevel: 'info',
      }),
      [ 'node', 'script', 'storages:drop' ],
    );
  });

  it('runs the queues:deleteAll command.', async(): Promise<void> => {
    const deleteAllQueues = jest.fn().mockReturnValue(Promise.resolve());
    (QueueAdapterAccessorRunner as jest.Mock).mockImplementation((): any => ({ deleteAllQueues }));
    // eslint-disable-next-line no-sync
    new Cli().runCliSync({ argv: [ 'node', 'script', 'queues:deleteAll' ]});
    // Wait until app.start has been called, because we can't await AppRunner.run.
    await flushPromises();
    expect(QueueAdapterAccessorRunner).toHaveBeenCalledTimes(1);
    expect(deleteAllQueues).toHaveBeenCalledTimes(1);
    expect(deleteAllQueues).toHaveBeenCalledWith(
      expect.objectContaining({
        loggingLevel: 'info',
      }),
      [ 'node', 'script', 'queues:deleteAll' ],
    );
  });

  it('runs the queues:delete command.', async(): Promise<void> => {
    const deleteQueue = jest.fn().mockReturnValue(Promise.resolve());
    (QueueAdapterAccessorRunner as jest.Mock).mockImplementation((): any => ({ deleteQueue }));
    // eslint-disable-next-line no-sync
    new Cli().runCliSync({ argv: [ 'node', 'script', 'queues:delete' ]});
    // Wait until app.start has been called, because we can't await AppRunner.run.
    await flushPromises();
    expect(QueueAdapterAccessorRunner).toHaveBeenCalledTimes(1);
    expect(deleteQueue).toHaveBeenCalledTimes(1);
    expect(deleteQueue).toHaveBeenCalledWith(
      expect.objectContaining({
        loggingLevel: 'info',
      }),
      [ 'node', 'script', 'queues:delete' ],
    );
  });

  it('runs the db:setup command.', async(): Promise<void> => {
    const setupDatabase = jest.fn().mockReturnValue(Promise.resolve());
    (StorageAccessorRunner as jest.Mock).mockImplementation((): any => ({ setupDatabase }));
    // eslint-disable-next-line no-sync
    new Cli().runCliSync({ argv: [ 'node', 'script', 'db:setup' ]});
    // Wait until app.start has been called, because we can't await AppRunner.run.
    await flushPromises();
    expect(StorageAccessorRunner).toHaveBeenCalledTimes(1);
    expect(setupDatabase).toHaveBeenCalledTimes(1);
    expect(setupDatabase).toHaveBeenCalledWith(
      expect.objectContaining({
        loggingLevel: 'info',
      }),
      [ 'node', 'script', 'db:setup' ],
    );
  });

  it('runs the db:migrate command.', async(): Promise<void> => {
    const runPendingMigrations = jest.fn().mockReturnValue(Promise.resolve());
    (StorageAccessorRunner as jest.Mock).mockImplementation((): any => ({ runPendingMigrations }));
    // eslint-disable-next-line no-sync
    new Cli().runCliSync({ argv: [ 'node', 'script', 'db:migrate' ]});
    // Wait until app.start has been called, because we can't await AppRunner.run.
    await flushPromises();
    expect(StorageAccessorRunner).toHaveBeenCalledTimes(1);
    expect(runPendingMigrations).toHaveBeenCalledTimes(1);
    expect(runPendingMigrations).toHaveBeenCalledWith(
      expect.objectContaining({
        loggingLevel: 'info',
      }),
      [ 'node', 'script', 'db:migrate' ],
    );
  });

  it('runs the db:revert command.', async(): Promise<void> => {
    const revertLastMigration = jest.fn().mockReturnValue(Promise.resolve());
    (StorageAccessorRunner as jest.Mock).mockImplementation((): any => ({ revertLastMigration }));
    // eslint-disable-next-line no-sync
    new Cli().runCliSync({ argv: [ 'node', 'script', 'db:revert' ]});
    // Wait until app.start has been called, because we can't await AppRunner.run.
    await flushPromises();
    expect(StorageAccessorRunner).toHaveBeenCalledTimes(1);
    expect(revertLastMigration).toHaveBeenCalledTimes(1);
    expect(revertLastMigration).toHaveBeenCalledWith(
      expect.objectContaining({
        loggingLevel: 'info',
      }),
      [ 'node', 'script', 'db:revert' ],
    );
  });

  it('runs the server when no command is specified.', async(): Promise<void> => {
    const runCli = jest.fn().mockReturnValue(Promise.resolve());
    (AppRunner as jest.Mock).mockImplementation((): any => ({ runCli }));
    // eslint-disable-next-line no-sync
    new Cli().runCliSync({ argv: [ 'node', 'script' ]});
    // Wait until app.start has been called, because we can't await AppRunner.run.
    await flushPromises();
    expect(AppRunner).toHaveBeenCalledTimes(1);
    expect(runCli).toHaveBeenCalledTimes(1);
    expect(runCli).toHaveBeenCalledWith(
      expect.objectContaining({
        loggingLevel: 'info',
      }),
      [ 'node', 'script' ],
    );
  });

  it('displays the help message when an invalid command is used.', async(): Promise<void> => {
    const error = jest.spyOn(console, 'error').mockImplementation(jest.fn() as any);
    const exit = jest.spyOn(process, 'exit').mockImplementation(jest.fn() as any);
    const originalArgv = process.argv;
    process.argv = [ 'node', 'script', 'go' ];
    // eslint-disable-next-line no-sync
    new Cli().runCliSync({ argv: [ 'node', 'script', 'go' ]});
    // Wait until app.start has been called, because we can't await AppRunner.run.
    await flushPromises();
    expect(QueueAdapterAccessorRunner).toHaveBeenCalledTimes(0);
    expect(StorageAccessorRunner).toHaveBeenCalledTimes(0);
    expect(AppRunner).toHaveBeenCalledTimes(0);

    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0].replace(/\s+/ug, ` `)).toEqual(HELP_MESSAGE);
    expect(exit).toHaveBeenCalledTimes(0);
    process.argv = originalArgv;
  });

  it('displays the help message when the help flag is used and exits with code 0.', async(): Promise<void> => {
    jest.spyOn(console, 'log').mockImplementation(jest.fn() as any);
    const error = jest.spyOn(console, 'error').mockImplementation(jest.fn() as any);
    const exit = jest.spyOn(process, 'exit').mockImplementation(jest.fn() as any);
    const originalArgv = process.argv;
    process.argv = [ 'node', 'script', '--help' ];
    // eslint-disable-next-line no-sync
    new Cli().runCliSync({ argv: [ 'node', 'script', '--help' ]});
    // Wait until app.start has been called, because we can't await AppRunner.run.
    await flushPromises();
    expect(QueueAdapterAccessorRunner).toHaveBeenCalledTimes(0);
    expect(StorageAccessorRunner).toHaveBeenCalledTimes(0);
    expect(AppRunner).toHaveBeenCalledTimes(0);
    expect(error).toHaveBeenCalledTimes(1);
    expect(error.mock.calls[0][0].replace(/\s+/ug, ` `)).toEqual(HELP_MESSAGE);
    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenLastCalledWith(0);
    process.argv = originalArgv;
  });

  it('exits the process if the command execution fails.', async(): Promise<void> => {
    jest.spyOn(console, 'error').mockImplementation(jest.fn() as any);
    const runCli = jest.fn().mockRejectedValue(new Error('Failure'));
    (AppRunner as jest.Mock).mockImplementation((): any => ({ runCli }));
    const write = jest.spyOn(process.stderr, 'write').mockImplementation(jest.fn());
    const exit = jest.spyOn(process, 'exit').mockImplementation(jest.fn() as any);
    // eslint-disable-next-line no-sync
    new Cli().runCliSync({ argv: [ 'node', 'script' ]});
    // Wait until app.start has been called, because we can't await AppRunner.run.
    await flushPromises();
    expect(QueueAdapterAccessorRunner).toHaveBeenCalledTimes(0);
    expect(StorageAccessorRunner).toHaveBeenCalledTimes(0);
    expect(AppRunner).toHaveBeenCalledTimes(1);
    expect(runCli).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledTimes(1);
    expect(write).toHaveBeenCalledWith('Failure');
    expect(exit).toHaveBeenCalledTimes(1);
    expect(exit).toHaveBeenLastCalledWith(1);
  });

  it('uses the default process.argv in case none are provided.', async(): Promise<void> => {
    const { argv } = process;
    const argvParameters = [ 'node', 'script' ];
    process.argv = argvParameters;
    const runCli = jest.fn();
    (AppRunner as jest.Mock).mockImplementation((): any => ({ runCli }));
    // eslint-disable-next-line no-sync
    new Cli().runCliSync({});
    // Wait until app.start has been called, because we can't await AppRunner.run.
    await flushPromises();
    expect(AppRunner).toHaveBeenCalledTimes(1);
    expect(runCli).toHaveBeenCalledTimes(1);
    expect(runCli).toHaveBeenCalledWith(
      expect.objectContaining({
        loggingLevel: 'info',
      }),
      argvParameters,
    );
    process.argv = argv;
  });
});
