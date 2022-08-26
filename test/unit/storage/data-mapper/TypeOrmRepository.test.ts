import type { Repository as TypeOrmInnerRepository } from 'typeorm';
import { TypeOrmRepository } from '../../../../src/storage/data-mapper/TypeOrmRepository';

describe('A TypeOrmRepository', (): void => {
  let innerRepository: TypeOrmInnerRepository<any>;
  let repository: TypeOrmRepository<any>;
  let where: any;

  beforeEach(async(): Promise<void> => {
    where = jest.fn();
    innerRepository = {
      create: jest.fn(),
      findOneBy: jest.fn(),
      findBy: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({ where }),
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
    expect(innerRepository.findOneBy).toHaveBeenCalledTimes(1);
    expect(innerRepository.findOneBy).toHaveBeenCalledWith({ foo: 'bar' });
  });

  it('delegates calls to findAll to the inner repository.', async(): Promise<void> => {
    await expect(repository.findAll({ foo: 'bar' })).resolves.toBeUndefined();
    expect(innerRepository.findBy).toHaveBeenCalledTimes(1);
    expect(innerRepository.findBy).toHaveBeenCalledWith({ foo: 'bar' });
  });

  it('delegates calls to buildQuery to the inner repository.', async(): Promise<void> => {
    await expect(repository.buildQuery('user', 'user.id = :id', { id: 1 })).resolves.toBeUndefined();
    expect(innerRepository.createQueryBuilder).toHaveBeenCalledTimes(1);
    expect(innerRepository.createQueryBuilder).toHaveBeenCalledWith('user');
    expect(where).toHaveBeenCalledTimes(1);
    expect(where).toHaveBeenCalledWith('user.id = :id', { id: 1 });
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
