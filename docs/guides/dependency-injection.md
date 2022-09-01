# Dependency Injection

{% hint style="info" %}
This section of the documentation (and in fact a lot about Solid on Rails) is heavily borrowed from the [Community Solid Server](https://github.com/CommunitySolidServer/CommunitySolidServer). Huge thanks to them for writing great open source code and documentation!
{% endhint %}

Solid on Rails uses the dependency injection framework [Components.js](https://componentsjs.readthedocs.io/) to link all its class instances together, and uses [Components-Generator.js](https://github.com/LinkedSoftwareDependencies/Components-Generator.js) to automatically generate the necessary description configurations of all classes. 

This framework allows developers to configure components in a JSON file. The advantage of this is that changing the configuration of components does not require any changes to the code, as one can just change the default configuration file, or provide a custom configuration file.

More information can be found in the Components.js [documentation](https://componentsjs.readthedocs.io/), but a summarized overview can be found below.

## Component files

Components.js requires a `.jsonld` component file for every class a developer might want to instantiate. Fortunately, those get generated automatically by [Components-Generator.js](https://github.com/LinkedSoftwareDependencies/Components-Generator.js).

In the Solid on Rails repository, calling `npm run build` will generate those JSON-LD files in the `dist` folder. The generator uses the `index.ts`, so new classes always have to be added there or they will not get a component file.

To do this in your application, assuming you've already installed [`@comake/skl-app-server`](https://www.npmjs.com/package/@comake/skl-app-server) via npm, do the following:

* Install Components-Generator.js:
  ```
  npm install --save-dev componentsjs-generator
  ```
* Add to or change the script commands in your `package.json` to include: 
  ```json
  {
    ...
    "scripts": {
      "build": "npm run build:ts && npm run build:components",
      "build:ts": "tsc",
      "build:components": "componentsjs-generator -s src -c dist/components -r my-application --typeScopedContexts",
      "prepare": "npm run build"
      ...
    }
  }
  ```
* Add the reccommended Components.js settings to your `package.json`:
  ```json
  {
    "name": "my-application",
    ...
    "lsd:module": "https://linkedsoftwaredependencies.org/bundles/npm/my-application",
    "lsd:components": "dist/components/components.jsonld",
    "lsd:contexts": {
      "https://linkedsoftwaredependencies.org/bundles/npm/my-application/^0.0.0/components/context.jsonld": "dist/components/context.jsonld"
    },
    "lsd:importPaths": {
      "https://linkedsoftwaredependencies.org/bundles/npm/my-application/^0.0.0/components/": "dist/components/",
      "https://linkedsoftwaredependencies.org/bundles/npm/my-application/^0.0.0/config/": "config/",
      "https://linkedsoftwaredependencies.org/bundles/npm/my-application/^0.0.0/dist/": "dist/"
    },
    "main": "./dist/index.js",
    "types": "./dist/index.d.ts",
    "files": [
      "dist",
      "config"
    ]
  }
  ```

* Make sure all your Typescript modules are exported from your `index.ts` file
  ```ts
  export * from './class1'
  export * from './some/path/class2'
  export * from './some/path/to/Utils'
  ```
* Build your app and see your `dist` folder fill with your compiled javascript and components.js configurations
  ```
  npm run build
  ```

# Configuration files

Configuration files are how we tell Components.js which classes to instantiate and link together. All the Solid on Rails configurations can be found in the [config folder](https://github.com/comake/skl-app-server/tree/feat/docs/config).

A single component in such a configuration file might look as follows:
```json
{
  "comment": "This is the entry point to the application. It can be used to both start and stop the server.",
  "@id": "urn:skl-app-server:default:App",
  "@type": "App",
  "initializer": { "@id": "urn:skl-app-server:default:Initializer" },
  "finalizer": { "@id": "urn:skl-app-server:default:Finalizer" }
}
```

Notice the matching argument names in the corresponding constructor of the [`App` class](https://github.com/comake/skl-app-server/blob/main/src/init/App.ts):
```ts
public constructor(initializer: Initializer, finalizer: Finalizable)
```

The important elements here are the following:

* `"comment"` - A description of this component (optional).
* `"@id"` - A unique identifier of this component, which allows it to be used as parameter values in different places (optional).
* `"@type"` - The class name of the component. This must be a TypeScript class name that is exported via `index.ts`.

As you can see from the constructor, the other fields are direct mappings from the constructor parameters. `initializer` and `finalizable` both reference other objects, which we refer to using their identifiers `(eg. `urn:skl-app-server:default:Initializer`). Parameters can also be literals like strings and numbers.

Any parameter can be defined using a variable that is set before calling Components.js. These variables are set when starting up the server, based on the command line parameters.
