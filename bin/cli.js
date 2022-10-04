#!/usr/bin/env node
const { Cli } = require("../dist");

const main = async () => {
  new Cli().runCliSync(process);
};

main();
