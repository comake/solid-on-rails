/* eslint-disable tsdoc/syntax */
import type { Arguments, Argv, Options } from 'yargs';
import yargs from 'yargs';
import type { CliExtractorArgs } from './CliExtractor';
import { CliExtractor } from './CliExtractor';

export type YargsArgOptions = Record<string, Options>;

export interface CliOptions {
  // Usage string printed in case of CLI errors
  usage?: string;
  // Errors on unknown CLI parameters when enabled.
  // @see https://yargs.js.org/docs/#api-reference-strictenabledtrue
  strictMode?: boolean;
  // Loads CLI args from environment variables when enabled.
  // @see http://yargs.js.org/docs/#api-reference-envprefix
  loadFromEnv?: boolean;
}

/**
 * Parses CLI args using the yargs library.
 * Specific settings can be enabled through the provided options.
 */
export class YargsCliExtractor extends CliExtractor {
  protected readonly yargsArgOptions: YargsArgOptions;
  protected readonly yargvOptions: CliOptions;

  /**
   * @param parameters - Parameters that should be parsed from the CLI. @range {json}
   *                     Format details can be found at https://yargs.js.org/docs/#api-reference-optionskey-opt
   * @param options - Additional options to configure yargs. @range {json}
   * @param extendedParameters - The same as @parameters. Separate variable so in Components.js
   *                          we can have both a default set and a user-added version. @range {json}
   */
  public constructor(
    parameters: YargsArgOptions = {},
    options: CliOptions = {},
    extendedParameters: YargsArgOptions = {},
  ) {
    super();
    this.yargsArgOptions = { ...parameters, ...extendedParameters };
    this.yargvOptions = options;
  }

  public async handle(args: CliExtractorArgs): Promise<Arguments> {
    return this.createYArgv(args.argv, args.envVarPrefix).parse();
  }

  /**
   * Creates the yargs Argv object based on the input CLI argv.
   */
  private createYArgv(argv: readonly string[], envVarPrefix: string): Argv {
    let yArgv = yargs(argv.slice(2));
    if (this.yargvOptions.usage !== undefined) {
      yArgv = yArgv.usage(this.yargvOptions.usage);
    }
    if (this.yargvOptions.strictMode) {
      yArgv = yArgv.strict();
    }
    if (this.yargvOptions.loadFromEnv) {
      yArgv = yArgv.env(envVarPrefix);
    }
    return yArgv.options(this.yargsArgOptions);
  }
}
