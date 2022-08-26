#!/usr/bin/env node
const { StorageAccessorRunner, absoluteFilePath, getLoggerFor } = require("../dist");

const main = async () => {
  const runner = new StorageAccessorRunner()
  const { app, ...other } = await runner.run(process);
  const logger = getLoggerFor('Seed Storages');
  try {
    const seedsFile = absoluteFilePath('./scripts/seeds.js');
    const seedsFunction = require(seedsFile);
    logger.info('Running seeds');
    await seedsFunction(other);
    logger.info('Successfully executed seeds');
  } finally {
    await app.stop();
  }
};

main();