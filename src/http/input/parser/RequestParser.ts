import { AsyncHandler } from '../../../util/handlers/AsyncHandler';
import type { HttpRequest } from '../../HttpRequest';
import type { ParsedRequest } from '../../ParsedRequest';

/**
 * Converts an incoming HttpRequest to an Operation.
 */
export abstract class RequestParser extends AsyncHandler<HttpRequest, ParsedRequest> {}
