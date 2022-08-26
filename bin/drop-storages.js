#!/usr/bin/env node
const { StorageAccessorRunner, getLoggerFor } = require("../dist");

const main = async () => {
  const runner = new StorageAccessorRunner()
  const { app, dataMapper, keyValue } = await runner.run(process);
  const logger = getLoggerFor('Drop Storages');
  try {
    // Drop Data Mapper database
    await dataMapper.initialize();
    await dataMapper.dropDatabase();
    logger.info('Successfully dropped Data Mapper database.');

    // Delete all keys in Key Value storage
    const keys = [];
    for await (const entry of keyValue.entries()) {
      keys.push(entry[0]);
    }
    await Promise.all(keys.map(key => keyValue.delete(key)));
    logger.info('Successfully deleted all keys from Key Value Storage.');
  } finally {
    await app.stop();
  }
};

main();