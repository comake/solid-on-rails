# Welcome to Solid on Rails

Solid on Rails is a web-application framework for building highly configurable & decentralized apps <br/> using <a href="https://nodejs.org/">Node.js</a>, <a href="https://solidproject.org/">Solid</a>, and <a href="https://www.comake.io/skl">SKL</a>. It is pre-configured with everything needed to create an application that can:

- Store application data in a database (relational or key-value)
- Expose an API (REST, GraphQL, etc.)
- Run asyncronous workloads in the background
- (Coming Soon) Store user data in a [Solid](https://solidproject.org/) pod
- (Coming Soon) Authenticate users with [Solid OIDC](https://solid.github.io/solid-oidc/)

## Features

### Dependency Injection

The SKL on Rails framework is designed to be flexible such that people can easily run different configurations. To do so, SKL on Rails uses the [dependency injection](https://martinfowler.com/articles/injection.html) framework [Components.js](https://componentsjs.readthedocs.io/). Components.js allows components to be instantiated and wired together declaratively using semantic configuration files. SKL on Rails also uses [Components-Generator.js](https://github.com/LinkedSoftwareDependencies/Components-Generator.js) to automatically generate the necessary description configurations of all classes. This framework allows us to configure our components in a JSON file. The advantage of this is that changing the configuration of components does not require any changes to the code, as one can just change the default configuration file, or provide a custom configuration file.

[Review the Dependency Injection Documentation](/guides/dependnecy-injection.md)

### Storage

SKL on Rails utilizes the [Data Mapper Pattern](https://en.wikipedia.org/wiki/Data_mapper_pattern) to separate your application's domain logic and it's usage of databases to store data. This means that you can create applications that are loosely coupled, and thus hightly scalable and maintainable. 

The Data Mapper Pattern is implemented using [TypeORM](https://typeorm.io/). 

[Review the Storage Documentation](/guides/storage.md)

### Routes

### Background Jobs

## Install

## Quick Start

