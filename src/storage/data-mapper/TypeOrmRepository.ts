import type { Repository as TypeOrmInnerRepository } from 'typeorm';
import type { Repository } from './Repository';

export class TypeOrmRepository<T> implements Repository {
  private readonly repository: TypeOrmInnerRepository<T>;

  public constructor(repository: TypeOrmInnerRepository<T>) {
    this.repository = repository;
  }

  public async create(entityOrEntities: any | any[]): Promise<any> {
    return this.repository.create(entityOrEntities);
  }

  public async find(options: any): Promise<any> {
    return this.repository.findOneBy(options);
  }

  public async query(query: string, parameters?: any[]): Promise<any> {
    return this.repository.query(query, parameters);
  }

  public async save(entityOrEntities: any | any[], options?: any): Promise<any> {
    return this.repository.save(entityOrEntities, options);
  }

  public async delete(criteria: any): Promise<any> {
    return this.repository.delete(criteria);
  }

  public async remove(entityOrEntities: any | any[], options?: any): Promise<any> {
    return this.repository.remove(entityOrEntities, options);
  }

  public async update(criteria: any, partialEntity: any): Promise<any> {
    return this.repository.update(criteria, partialEntity);
  }

  public async count(options: any): Promise<any> {
    return this.repository.count(options);
  }
}
