/* eslint-disable @typescript-eslint/naming-convention */
import { ComponentsManager } from 'componentsjs';
import { TaskAccessorRunner } from '../../../src/cli/TaskAccessorRunner';
import type { App } from '../../../src/init/App';
import type { CliExtractor } from '../../../src/init/cli/CliExtractor';
import type { SettingsResolver } from '../../../src/init/variables/SettingsResolver';
import type { QueueAdapter } from '../../../src/jobs/adapter/QueueAdapter';
import type { TypeOrmDataMapper } from '../../../src/storage/data-mapper/TypeOrmDataMapper';
import type { KeyValueStorage } from '../../../src/storage/keyvalue/KeyValueStorage';
import type { CliParameters } from '../../../src/util/ComponentsJsUtil';
import { joinFilePath } from '../../../src/util/PathUtil';

const app: jest.Mocked<App> = {
  start: jest.fn(),
  stop: jest.fn(),
} as any;

const dataMapper: jest.Mocked<TypeOrmDataMapper> = {
  initialize: jest.fn(),
  dropDatabase: jest.fn(),
  runPendingMigrations: jest.fn(),
  revertLastMigration: jest.fn(),
  setupDatabase: jest.fn(),
} as any;

const keyValue: jest.Mocked<KeyValueStorage<any, any>> = {
  entries: jest.fn().mockReturnValue([[ 'key', 'value' ], [ 'key2', 'value2' ]]),
  delete: jest.fn(),
} as any;

const queueAdapter: jest.Mocked<QueueAdapter> = {
  deleteAllQueues: jest.fn(),
  deleteQueue: jest.fn(),
} as any;

const instances = {
  app,
  dataMapper,
  keyValue,
  queueAdapter,
};

const defaultParameters = {
  port: 3000,
  logLevel: 'info',
};

const cliExtractor: jest.Mocked<CliExtractor> = {
  handleSafe: jest.fn().mockResolvedValue(defaultParameters),
} as any;

const defaultVariables = {
  'urn:solid-on-rails:default:variable:port': 3000,
  'urn:solid-on-rails:default:variable:loggingLevel': 'info',
};

const settingsResolver: jest.Mocked<SettingsResolver> = {
  handleSafe: jest.fn().mockResolvedValue(defaultVariables),
} as any;

const manager: jest.Mocked<ComponentsManager<Record<string, any>>> = {
  instantiate: jest.fn(async(iri: string): Promise<any> => {
    switch (iri) {
      case 'urn:solid-on-rails-setup:default:CliResolver': return { cliExtractor, settingsResolver };
      case 'urn:solid-on-rails:task-accessor:Instances': return instances;
      default: throw new Error('unknown iri');
    }
  }),
  configRegistry: {
    register: jest.fn(),
  },
} as any;

jest.mock('componentsjs', (): any => ({
  ComponentsManager: {
    build: jest.fn(async(): Promise<ComponentsManager<Record<string, any>>> => manager),
  },
}));

jest.spyOn(process, 'cwd').mockReturnValue('/var/cwd');

const basicTaskFunction = jest.fn();
jest.mock(
  '/var/cwd/tasks/basicTask.js',
  (): any => basicTaskFunction,
  { virtual: true },
);

describe('TaskAccessorRunner', (): void => {
  let params: CliParameters;

  beforeEach(async(): Promise<void> => {
    params = {
      config: './config.json',
      loggingLevel: 'info',
      mainModulePath: undefined,
      modulePathPlaceholder: '@SoR:',
      envVarPrefix: '',
    };
  });

  afterEach((): void => {
    jest.clearAllMocks();
  });

  describe('runTask', (): void => {
    it('runs the server and executes the task function.', async(): Promise<void> => {
      const runner = new TaskAccessorRunner();
      await expect(runner.runTask(params, [ 'node', 'task', 'basicTask', 'arg1' ])).resolves.toBeUndefined();
      expect(ComponentsManager.build).toHaveBeenCalledTimes(1);
      expect(ComponentsManager.build).toHaveBeenCalledWith({
        dumpErrorState: true,
        logLevel: 'info',
        mainModulePath: joinFilePath(__dirname, '../../../'),
      });
      expect(manager.configRegistry.register).toHaveBeenCalledTimes(1);
      expect(manager.configRegistry.register).toHaveBeenCalledWith('/var/cwd/config.json');
      expect(manager.instantiate).toHaveBeenCalledTimes(2);
      expect(manager.instantiate).toHaveBeenNthCalledWith(
        1,
        'urn:solid-on-rails-setup:default:CliResolver',
        { variables: { 'urn:solid-on-rails:default:variable:modulePathPlaceholder': '@SoR:' }},
      );
      expect(cliExtractor.handleSafe).toHaveBeenCalledTimes(1);
      expect(cliExtractor.handleSafe).toHaveBeenCalledWith({
        argv: [ 'node', 'task', 'basicTask', 'arg1' ],
        envVarPrefix: '',
      });
      expect(settingsResolver.handleSafe).toHaveBeenCalledTimes(1);
      expect(settingsResolver.handleSafe).toHaveBeenCalledWith(defaultParameters);
      expect(manager.instantiate).toHaveBeenNthCalledWith(2,
        'urn:solid-on-rails:task-accessor:Instances',
        { variables: defaultVariables });
      expect(app.start).toHaveBeenCalledTimes(1);
      expect(basicTaskFunction).toHaveBeenCalledTimes(1);
      expect(basicTaskFunction).toHaveBeenCalledWith({
        instances: {
          dataMapper,
          keyValue,
          queueAdapter,
        },
        env: params,
        taskArgs: [ 'arg1' ],
      });
      expect(app.stop).toHaveBeenCalledTimes(1);
    });
  });
});
