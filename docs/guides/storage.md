# Storage

Solid on Rails uses [TypeORM](https://typeorm.io/) to enable applications to store data in databases. 

More information can be found in the TypeORM [documentation](https://typeorm.io/), but a summarized overview can be found below.

## Data Mapper 

When using the Data Mapper framework, developers access the functionality of their data store through Repositories. Repositories perform bi-directional transfer of data between a persistent data store (often a relational database) and an in-memory data representation (the domain layer). 

The goal of the Data Mapper pattern is to keep the in-memory representation and the persistent data store independent of each other and the data mapper itself (Repositories). This is useful when one needs to model and enforce strict business processes on the data in the domain layer that do not map neatly to the persistent data store.

## Configuration

The default Data Mapper within Solid on Rails is configured by the [type-orm.json](https://github.com/comake/solid-on-rails/blob/main/config/storage/data-mapper/type-orm.json) Components.js configuration. Override this default configuration by replacing it in your Components.js config file:

```diff
- "files-sor:config/storage/data-mapper/type-orm.json",
+ "files-myapp:config/storage/data-mapper/type-orm.json",
```

In your configuration do two things:

1. Set the `options` parameter to contain the type, location, and credentials for your database
  ```json
  "options": {
    "type": "postgres",
    "host": "0.0.0.0",
    "port": 5432,
    "username": "postgres",
    "password": "abc123",
    "database": "development"
  }
  ```

2. Add some Entity Schemas. See the TypeORM [documentation](https://typeorm.io/separating-entity-definition) and the [example repo configuration](https://github.com/comake/example-solid-on-rails-app/blob/main/config/storage/data-mapper/type-orm.json) for reference:

  ```json
  "entitySchemaFactories": [
    { "@type": "UserEntitySchemaFactory" }
  ]
  ```

  ```ts
  import { baseColumnSchemaPart, TypeOrmEntitySchemaFactory } from '@comake/solid-on-rails';

  export interface User {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    name: string;
  }

  /**
  * An example {@link TypeOrmEntitySchemaFactory}. Models a User schema with base columns and a name.
  */
  export class UserEntitySchemaFactory extends TypeOrmEntitySchemaFactory<User> {
    protected readonly schema = {
      name: 'User',
      columns: {
        ...baseColumnSchemaPart,
        name: {
          type: String,
        },
      },
    };
  }
  ```

  Be sure to include this file in your `index.ts`,


## Usage

After adding the Entity Schemas and configurations, you can access repositories using the Data Mapper instance in your code:

  ```ts
  import type { TypeOrmDataMapper } from '@comake/solid-on-rails';
  import type { User } from './UserEntitySchemaFactory';

  export class MySpecialUserCreator {
    private readonly dataMapper: TypeOrmDataMapper;

    public constructor(dataMapper: TypeOrmDataMapper) {
      this.dataMapper = dataMapper;
    }

    public async createUser(userParameters: Partial<User>): Promise<void> {
      const userRepository = this.dataMapper.getRepository<User>('User');
      const user = userRepository.create(userParameters as Partial<User>);
      await userRepository.save(user);
    }
  }
  ```

  Remember to add the Data Mapper as an parameter to any class instantiated in your Components.js  configuration which needs to access data from your data store:
  ```json
  {
    "@type": "MySpecialUserCreator",
    "dataMapper": { "@id": "urn:solid-on-rails:default:DataMapper" }
  }
  ```

  ## User Data

  Solid integration coming soon!