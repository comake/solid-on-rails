#!/usr/bin/env node
const { AppRunner } = require("..");

const main = async () => {
  new AppRunner().runCliSync(process);
};

main();
