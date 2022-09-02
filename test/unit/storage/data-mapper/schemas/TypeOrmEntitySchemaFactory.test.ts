import { EntitySchema } from 'typeorm';
import { baseColumnSchemaPart } from '../../../../../src/storage/data-mapper/schemas/BaseColumnSchemaPart';
import { TypeOrmEntitySchemaFactory } from '../../../../../src/storage/data-mapper/schemas/TypeOrmEntitySchemaFactory';

jest.mock('typeorm');

type Dummy = {
  id: number;
  createdAt: Date;
  updatedAt: Date;
};

const dummySchema = {
  name: 'Dummy',
  columns: baseColumnSchemaPart,
};

class DummyFactory extends TypeOrmEntitySchemaFactory<Dummy> {
  protected readonly schema = dummySchema;
}

describe('A TypeOrmEntitySchemaFactory', (): void => {
  it('generates an EntitySchema.', (): void => {
    const entitySchema = {} as any;
    (EntitySchema as jest.Mock).mockImplementation((): any => entitySchema);
    const factory = new DummyFactory();
    expect(factory.generate()).toBe(entitySchema);
    expect(EntitySchema).toHaveBeenCalledTimes(1);
    expect(EntitySchema).toHaveBeenCalledWith(dummySchema);
  });
});
