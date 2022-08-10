import { EntitySchema } from 'typeorm';
import { UserEntitySchemaFactory } from '../../../../../src/storage/data-mapper/schemas/UserEntitySchemaFactory';

jest.mock('typeorm');

describe('A UserEntitySchemaFactory', (): void => {
  let factory: UserEntitySchemaFactory;
  let entitySchemaConstructor: any;

  beforeEach(async(): Promise<void> => {
    entitySchemaConstructor = jest.fn()
      .mockImplementation((schema): EntitySchema => ({ options: { name: schema.name }} as any));
    (EntitySchema as jest.Mock).mockImplementation(entitySchemaConstructor);
    factory = new UserEntitySchemaFactory();
  });

  it('generates an Entity Schema.', async(): Promise<void> => {
    const res = factory.generate();
    expect(res.options.name).toBe('User');
    expect(entitySchemaConstructor).toHaveBeenCalledTimes(1);
    expect(entitySchemaConstructor).toHaveBeenCalledWith({
      name: 'User',
      columns: {
        id: {
          type: Number,
          primary: true,
          generated: true,
        },
        createdAt: {
          name: 'created_at',
          type: 'timestamp with time zone',
          createDate: true,
        },
        updatedAt: {
          name: 'updated_at',
          type: 'timestamp with time zone',
          updateDate: true,
        },
        name: {
          type: String,
        },
      },
    });
  });
});
