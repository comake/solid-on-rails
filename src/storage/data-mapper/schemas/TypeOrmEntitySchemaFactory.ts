import type { EntitySchemaOptions } from 'typeorm';
import { EntitySchema } from 'typeorm';

export abstract class TypeOrmEntitySchemaFactory<T> {
  protected abstract readonly schema: EntitySchemaOptions<T>;

  public generate(): EntitySchema {
    return new EntitySchema<T>(this.schema);
  }
}
