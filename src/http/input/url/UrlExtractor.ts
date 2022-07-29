import { AsyncHandler } from '../../../util/handlers/AsyncHandler';
import type { HttpRequest } from '../../HttpRequest';

/**
 * Extracts a URL from an incoming {@link HttpRequest}.
 */
export abstract class UrlExtractor extends AsyncHandler<{ request: HttpRequest }, URL> {}
