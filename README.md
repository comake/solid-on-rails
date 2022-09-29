<div align="center">
  <a href="https://github.com/comake/solid-on-rails">
    <img src="./resources/solid-on-rails.png" width="150" height="150">
  </a>
  <br/>
  <br/>
  <h2>Solid on Rails</h2>
  <p>
    A web-application framework for building highly configurable & decentralized apps <br/> using <a href="https://nodejs.org/">Node.js</a>, <a href="https://www.comake.io/skl">SKL</a>, and <a href="https://solidproject.org/">Solid</a>.
  </p>
  <p>
    <a href="#features"><strong>Features</strong></a> ·
    <a href="#requirements"><strong>Requirements</strong></a> ·
    <a href="#quick-start"><strong>Quick Start</strong></a> ·
    <a href="https://comake-1.gitbook.io/solid-on-rails/"><strong>Documentation</strong></a>
  </p>
  <p>
    <a href="https://github.com/comake/solid-on-rails/actions/workflows/ci.yml">
      <img src="https://github.com/comake/solid-on-rails/actions/workflows/ci.yml/badge.svg">
    </a>
  </p>
  <br>
  <br>
</div>

---
<br/>

Solid on Rails was created to make it easy for developers to get up an running with [SKL](https://www.comake.io/skl) and [Solid](https://solidproject.org/). Taking inspiration from the success of [Ruby on Rails](https://rubyonrails.org/), it comes pre-configured with everything needed to create an application that can:

- Store application data in a database (relational or key-value)
- Expose an API (REST, GraphQL, etc.)
- Run asyncronous workloads in the background
- (Coming Soon) Store user data in a [Solid](https://solidproject.org/) pod
- (Coming Soon) Authenticate users with [Solid OIDC](https://solid.github.io/solid-oidc/)

## Features

### Dependency Injection

The Solid on Rails framework is designed to be flexible such that people can easily run different configurations. To do so, Solid on Rails uses the [dependency injection](https://martinfowler.com/articles/injection.html) framework [Components.js](https://componentsjs.readthedocs.io/). 

Components.js allows components to be instantiated and wired together declaratively using semantic configuration files. Solid on Rails also uses [Components-Generator.js](https://github.com/LinkedSoftwareDependencies/Components-Generator.js) to automatically generate the necessary description configurations of all classes. Components are configured in JSON files, which makes it so that changing the configuration does not require any changes to the code.

[Get started configuring your application](https://comake-1.gitbook.io/solid-on-rails/guides/getting-started)

### Storage

Solid on Rails utilizes the [Data Mapper Pattern](https://en.wikipedia.org/wiki/Data\_mapper\_pattern) to separate an application's domain logic and it's usage of databases to store data. This means that you can create applications that are loosely coupled, and thus hightly scalable and maintainable.

The Data Mapper Pattern is implemented using [TypeORM](https://typeorm.io/).

[Learn more about Storage](https://comake-1.gitbook.io/solid-on-rails/guides/storage)

### Routes

Like Rails, routes to connect URLs to code for the application's API or web pages are defined in a configuration file. Each route matches a URL pattern and HTTP method to a specific handler (or a chain of handlers). These handlers are defined in JSON using the dependency injection framework Components.js.

[Learn more about Routes](https://comake-1.gitbook.io/solid-on-rails/guides/routes)

### Background Jobs

Solid on Rails comes with a built in system for scheduling background jobs to be executed outside of the main process. Background job queues can solve many different problems, from smoothing out processing peaks to creating robust communication channels between microservices or offloading heavy work from one server to many smaller workers, etc.

A variety of queuing backends can be used but the default configuration uses [Bull](https://optimalbits.github.io/bull/).

[Learn more about Background Jobs](https://comake-1.gitbook.io/solid-on-rails/guides/background-jobs)

## Requirements 

Please ensure your operating system has the following software installed:
* [Git](https://git-scm.com/) - see [GitHub's tutorial](https://help.github.com/articles/set-up-git/) for installation
* [Node.js](https://nodejs.org/) - use [nvm](https://github.com/creationix/nvm) to install it on any OS, or [brew](https://brew.sh/) on a mac
* [Redis](https://redis.io/)  - follow the [Redis installation guide](https://redis.io/docs/getting-started/installation/) for your OS. Alternatively, run the [Redis Docker image](https://hub.docker.com/_/redis).
* A database - for storage of application data (if required). See [TypeORM's Data Source documentation](https://typeorm.io/data-source-options) for options that work out-of-the-box. Run your database as a service on your OS or with Docker.

{% hint style="info" %}
If your application doesn't need background job processing, you don't need to run Redis (See [How to remove Background Jobs](https://comake-1.gitbook.io/solid-on-rails/guides/background-jobs#remove)).
{% endhint %}

{% hint style="info" %}
If your application doesn't need to store applicaton data, you don't need to run a database (See [How to remove application data storage](https://comake-1.gitbook.io/solid-on-rails/guides/storage#remove)).
{% endhint %}

## Quick Start

Create a Node.js application (if you haven't already):
```
mkdir my-application
cd my-application
npm init
```

Install the latest server version from the npm package repository:

```
npm install --save @comake/solid-on-rails
```

Add the start command to `scripts` in your `package.json`

```json
"scripts": {
  "start": "npx solid-on-rails"
}
```

Start the server! 🚀
```
npm run start
```

Continue to the [Getting Started guide](https://comake-1.gitbook.io/solid-on-rails/guides/getting-started) to learn how to create your own [Components.js](https://componentsjs.readthedocs.io/) configuration to customize your application with your own routes, plugins, background jobs, and more.

---

### TODO
 - [ ] Break up BaseHttpServerFactory createServer function
 - [ ] UiEnabledConverter?
 - [ ] Add integration tests for Storage Accessor

### Note
There's a bug with typeorm and componentsjs-generator
You have to add `"./package.json": "./package.json",` to the exports of `node_modules/typeorm/package.json`.
See:
- https://github.com/typeorm/typeorm/issues/9178
- https://github.com/LinkedSoftwareDependencies/Components-Generator.js/issues/83
