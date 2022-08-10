import { OkResponseDescription } from '../../http/output/response/OkResponseDescription';
import type { ResponseDescription } from '../../http/output/response/ResponseDescription';
import type { DataMapper } from '../../storage/data-mapper/DataMapper';
import type { User } from '../../storage/data-mapper/schemas/UserEntitySchemaFactory';
import { APPLICATION_JSON } from '../../util/ContentTypes';
import { addHeader } from '../../util/HeaderUtil';
import { guardedStreamFromJson } from '../../util/StreamUtil';
import { ParsedRequestHandler } from '../ParsedRequestHandler';
import type { ParsedRequestHandlerInput } from '../ParsedRequestHandler';

/**
 *
 */
export class GetUserHandler extends ParsedRequestHandler {
  private readonly dataMapper: DataMapper;

  public constructor(dataMapper: DataMapper) {
    super();
    this.dataMapper = dataMapper;
  }

  public async handle(input: ParsedRequestHandlerInput): Promise<ResponseDescription> {
    if (!input.request.pathParams?.id) {
      throw new Error('Id parameter required.');
    }
    const userRepository = this.dataMapper.getRepository('User');
    const user: User = await userRepository.find({ id: input.request.pathParams.id });
    const data = guardedStreamFromJson(user);

    addHeader(input.response, 'Content-Type', APPLICATION_JSON);
    return new OkResponseDescription(data);
  }
}
