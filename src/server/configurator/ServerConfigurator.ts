import type { Server } from 'http';
import { AsyncHandler } from '../../util/handlers/AsyncHandler';

/**
 * Configures a {@link Server} by attaching listeners for specific events.
 */
export abstract class ServerConfigurator extends AsyncHandler<Server> {}
