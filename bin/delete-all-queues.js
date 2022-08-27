#!/usr/bin/env node
const { QueueAdapterAccessorRunner, getLoggerFor } = require("../dist");

const main = async () => {
  const runner = new QueueAdapterAccessorRunner()
  const { app, queueAdapter } = await runner.run(process);
  const logger = getLoggerFor('Delete all queues');
  try {
    await queueAdapter.deleteAllQueues();
    logger.info('Successfully deleted all queues.');
  } finally {
    await app.stop();
  }
};

main();