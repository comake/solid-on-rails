import type { Key } from 'path-to-regexp';
import { AsyncHandler } from '../../../util/handlers/AsyncHandler';
import type { ParsedRequest } from '../../ParsedRequest';

export interface ParameterExtractorArgs {
  request: ParsedRequest;
  pathRegex: RegExp;
  pathKeys: Key[];
}

/**
 * Extracts the parameters from a {@link ParsedRequest}.
 */
export abstract class ParameterExtractor extends AsyncHandler<ParameterExtractorArgs, NodeJS.Dict<any>> {}
