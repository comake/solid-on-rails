import { CreatedResponseDescription } from '../../http/output/response/CreatedResponseDescription';
import type { ResponseDescription } from '../../http/output/response/ResponseDescription';
import type { DataMapper } from '../../storage/data-mapper/DataMapper';
import type { User } from '../../storage/data-mapper/schemas/UserEntitySchemaFactory';
import { APPLICATION_JSON } from '../../util/ContentTypes';
import { addHeader } from '../../util/HeaderUtil';
import { guardedStreamFromJson, readJsonStream } from '../../util/StreamUtil';
import { ParsedRequestHandler } from '../ParsedRequestHandler';
import type { ParsedRequestHandlerInput } from '../ParsedRequestHandler';

/**
 *
 */
export class CreateUserHandler extends ParsedRequestHandler {
  private readonly dataMapper: DataMapper;

  public constructor(dataMapper: DataMapper) {
    super();
    this.dataMapper = dataMapper;
  }

  public async handle(input: ParsedRequestHandlerInput): Promise<ResponseDescription> {
    const params = await readJsonStream(input.request.data);
    if (!params.user) {
      // Should validate parameters
      throw new Error('param is missing or the value is empty: user');
    }
    const userRepository = this.dataMapper.getRepository('User');
    const user: User = await userRepository.create(params.user);
    await userRepository.save(user);
    const data = guardedStreamFromJson(user);

    addHeader(input.response, 'Content-Type', APPLICATION_JSON);
    return new CreatedResponseDescription(data);
  }
}
