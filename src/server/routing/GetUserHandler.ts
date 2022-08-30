import { OkResponseDescription } from '../../http/output/response/OkResponseDescription';
import type { ResponseDescription } from '../../http/output/response/ResponseDescription';
import type { User } from '../../storage/data-mapper/schemas/UserEntitySchemaFactory';
import type { TypeOrmDataMapper } from '../../storage/data-mapper/TypeOrmDataMapper';
import { APPLICATION_JSON } from '../../util/ContentTypes';
import { NotFoundHttpError } from '../../util/errors/NotFoundHttpError';
import { addHeader } from '../../util/HeaderUtil';
import { guardedStreamFromJson } from '../../util/StreamUtil';
import { ParsedRequestHandler } from '../ParsedRequestHandler';
import type { ParsedRequestHandlerInput } from '../ParsedRequestHandler';

/**
 *
 */
export class GetUserHandler extends ParsedRequestHandler {
  private readonly dataMapper: TypeOrmDataMapper;

  public constructor(dataMapper: TypeOrmDataMapper) {
    super();
    this.dataMapper = dataMapper;
  }

  public async handle(input: ParsedRequestHandlerInput): Promise<ResponseDescription> {
    if (!input.request.pathParams?.id) {
      throw new Error('Id parameter required.');
    }
    const id = Number.parseInt(input.request.pathParams.id, 10);
    const userRepository = this.dataMapper.getRepository<User>('User');
    const user = await userRepository.findOneBy({ id });
    if (!user) {
      throw new NotFoundHttpError(`Could not find user with id: ${id}`);
    }

    const data = guardedStreamFromJson(user);
    addHeader(input.response, 'Content-Type', APPLICATION_JSON);
    return new OkResponseDescription(data);
  }
}
