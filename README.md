# Standard Knowledge Language Application Server

A template for SKL applications

# TODO
 - [ ] Break up BaseHttpServerFactory createServer function
 - [ ] UiEnabledConverter?
 - [ ] Add integration tests for Storage Accessor

# Note
There's a bug with typeorm and componentsjs-generator
You have to add `"./package.json": "./package.json",` to the exports of `node_modules/typeorm/package.json`.
See:
- https://github.com/typeorm/typeorm/issues/9178
- https://github.com/LinkedSoftwareDependencies/Components-Generator.js/issues/83
