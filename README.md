<div align="center">
  <a href="https://github.com/comake/skl-app-server">
    <img src="./resources/skl.svg" width="150" height="150">
  </a>
  <br/>
  <br/>
  <h2>SKL on Rails</h2>
  <p>
    A web-application framework for building highly configurable & decentralized apps <br/> using <a href="https://nodejs.org/">Node.js</a>, <a href="https://www.comake.io/skl">SKL</a>, and <a href="https://solidproject.org/">Solid</a>.
  </p>
  <p>
    <a href="#bull-features"><strong>Features</strong></a> ·
    <a href="#install"><strong>Install</strong></a> ·
    <a href="#quick-guide"><strong>Quick Start</strong></a> ·
    <a href="https://app.gitbook.com/s/Dbvw06OMs2fMDmC8CZep/"><strong>Documentation</strong></a>
  </p>
  <p>
    <a href="https://github.com/comake/skl-app-server/actions/workflows/ci.yml">
      <img src="https://github.com/comake/skl-app-server/actions/workflows/ci.yml/badge.svg">
    </a>
  </p>
  <br>
  <br>
</div>

---
<br/>

SKL on Rails was created to make it easy for developers to get up an running with [SKL](https://www.comake.io/skl) and [Solid](https://solidproject.org/). It is pre-configured with everything to create an application that needs to:

- Store application data in a database (relational or key-value)
- Expose an API (REST, GraphQL, etc.)
- Run asyncronous workloads in the background
- (Coming Soon) Store user data in a [Solid](https://solidproject.org/) pod
- (Coming Soon) Authenticate users with [Solid OIDC](https://solid.github.io/solid-oidc/)

## Features

### Dependency Injection

The SKL on Rails framework is designed to be flexible such that people can easily run different configurations. To do so, SKL on Rails uses the [dependency injection](https://martinfowler.com/articles/injection.html) framework [Components.js](https://componentsjs.readthedocs.io/). Components.js allows components to be instantiated and wired together declaratively using semantic configuration files. SKL on Rails also uses [Components-Generator.js](https://github.com/LinkedSoftwareDependencies/Components-Generator.js) to automatically generate the necessary description configurations of all classes. This framework allows us to configure our components in a JSON file. The advantage of this is that changing the configuration of components does not require any changes to the code, as one can just change the default configuration file, or provide a custom configuration file.

[Learn more about Dependency Injection](https://app.gitbook.com/s/Dbvw06OMs2fMDmC8CZep/guides/dependency-injection)

### Storage

SKL on Rails utilizes the [Data Mapper Pattern](https://en.wikipedia.org/wiki/Data_mapper_pattern) to separate your application's domain logic and it's usage of databases to store data. This means that you can create applications that are loosely coupled, and thus hightly scalable and maintainable. 

The Data Mapper Pattern is implemented using [TypeORM](https://typeorm.io/). 

[Learn more about Storage](https://app.gitbook.com/s/Dbvw06OMs2fMDmC8CZep/guides/storage)

### Routes

[Learn more about Routes](https://app.gitbook.com/s/Dbvw06OMs2fMDmC8CZep/guides/routes)

### Background Jobs

[Learn more about Background Jobs](https://app.gitbook.com/s/Dbvw06OMs2fMDmC8CZep/guides/background-jobs)

## Install

## Quick Start

---

### TODO
 - [ ] Break up BaseHttpServerFactory createServer function
 - [ ] UiEnabledConverter?
 - [ ] Add integration tests for Storage Accessor

# Note
There's a bug with typeorm and componentsjs-generator
You have to add `"./package.json": "./package.json",` to the exports of `node_modules/typeorm/package.json`.
See:
- https://github.com/typeorm/typeorm/issues/9178
- https://github.com/LinkedSoftwareDependencies/Components-Generator.js/issues/83
