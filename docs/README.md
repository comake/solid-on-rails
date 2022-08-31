# Welcome to Solid on Rails

Solid on Rails is a web-application framework for building highly configurable & decentralized apps\
using [Node.js](https://nodejs.org/), [Solid](https://solidproject.org/), and [SKL](https://www.comake.io/skl). It is pre-configured with everything needed to create an application that can:

* Store application data in a database (relational or key-value)
* Expose an API (REST, GraphQL, etc.)
* Run asyncronous workloads in the background
* (Coming Soon) Store user data in a [Solid](https://solidproject.org/) pod
* (Coming Soon) Authenticate users with [Solid OIDC](https://solid.github.io/solid-oidc/)

## Features

### Dependency Injection

The SKL on Rails framework is designed to be flexible such that people can easily run different configurations. To do so, SKL on Rails uses the [dependency injection](https://martinfowler.com/articles/injection.html) framework [Components.js](https://componentsjs.readthedocs.io/). Components.js allows components to be instantiated and wired together declaratively using semantic configuration files. SKL on Rails also uses [Components-Generator.js](https://github.com/LinkedSoftwareDependencies/Components-Generator.js) to automatically generate the necessary description configurations of all classes. This framework allows us to configure our components in a JSON file. The advantage of this is that changing the configuration of components does not require any changes to the code, as one can just change the default configuration file, or provide a custom configuration file.

{% content-ref url="guides/dependency-injection.md" %}
[Learn more about Dependency Injection](guides/dependency-injection.md)
{% endcontent-ref %}

### Storage

SKL on Rails utilizes the [Data Mapper Pattern](https://en.wikipedia.org/wiki/Data\_mapper\_pattern) to separate your application's domain logic and it's usage of databases to store data. This means that you can create applications that are loosely coupled, and thus hightly scalable and maintainable.

The Data Mapper Pattern is implemented using [TypeORM](https://typeorm.io/).

{% content-ref url="guides/storage.md" %}
[Learn more about Storage](guides/storage.md)
{% endcontent-ref %}

### Routes

{% content-ref url="guides/routes.md" %}
[Learn more about Routes](guides/routes.md)
{% endcontent-ref %}

### Background Jobs

{% content-ref url="guides/background-jobs.md" %}
[Learn more about Background Jobs](guides/background-jobs.md)
{% endcontent-ref %}

## Install

## Quick Start
