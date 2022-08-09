import type { Repository as TypeOrmInnerRepository } from 'typeorm';
import { TypeOrmRepository } from '../../../../src/storage/data-mapper/TypeOrmRepository';

describe('A TypeOrmRepository', (): void => {
  let innerRepository: TypeOrmInnerRepository<any>;
  let repository: TypeOrmRepository<any>;

  beforeEach(async(): Promise<void> => {
    innerRepository = {
      create: jest.fn(),
      find: jest.fn(),
      query: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      remove: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    } as any;
    repository = new TypeOrmRepository(innerRepository);
  });

  it('delegates calls to create to the inner repository.', async(): Promise<void> => {
    await expect(repository.create({ foo: 'bar' })).resolves.toBeUndefined();
    expect(innerRepository.create).toHaveBeenCalledTimes(1);
    expect(innerRepository.create).toHaveBeenCalledWith({ foo: 'bar' });
  });

  it('delegates calls to find to the inner repository.', async(): Promise<void> => {
    await expect(repository.find({ foo: 'bar' })).resolves.toBeUndefined();
    expect(innerRepository.find).toHaveBeenCalledTimes(1);
    expect(innerRepository.find).toHaveBeenCalledWith({ foo: 'bar' });
  });

  it('delegates calls to query to the inner repository.', async(): Promise<void> => {
    await expect(repository.query('hello world', [ 'foobar' ])).resolves.toBeUndefined();
    expect(innerRepository.query).toHaveBeenCalledTimes(1);
    expect(innerRepository.query).toHaveBeenCalledWith('hello world', [ 'foobar' ]);
  });

  it('delegates calls to save to the inner repository.', async(): Promise<void> => {
    await expect(repository.save({ name: 'Adler' }, {})).resolves.toBeUndefined();
    expect(innerRepository.save).toHaveBeenCalledTimes(1);
    expect(innerRepository.save).toHaveBeenCalledWith({ name: 'Adler' }, {});
  });

  it('delegates calls to delete to the inner repository.', async(): Promise<void> => {
    await expect(repository.delete({ foo: 'bar' })).resolves.toBeUndefined();
    expect(innerRepository.delete).toHaveBeenCalledTimes(1);
    expect(innerRepository.delete).toHaveBeenCalledWith({ foo: 'bar' });
  });

  it('delegates calls to remove to the inner repository.', async(): Promise<void> => {
    await expect(repository.remove({ foo: 'bar' }, {})).resolves.toBeUndefined();
    expect(innerRepository.remove).toHaveBeenCalledTimes(1);
    expect(innerRepository.remove).toHaveBeenCalledWith({ foo: 'bar' }, {});
  });

  it('delegates calls to update to the inner repository.', async(): Promise<void> => {
    await expect(repository.update({ foo: 'bar' }, { name: 'Adler' })).resolves.toBeUndefined();
    expect(innerRepository.update).toHaveBeenCalledTimes(1);
    expect(innerRepository.update).toHaveBeenCalledWith({ foo: 'bar' }, { name: 'Adler' });
  });

  it('delegates calls to count to the inner repository.', async(): Promise<void> => {
    await expect(repository.count({ foo: 'bar' })).resolves.toBeUndefined();
    expect(innerRepository.count).toHaveBeenCalledTimes(1);
    expect(innerRepository.count).toHaveBeenCalledWith({ foo: 'bar' });
  });
});
