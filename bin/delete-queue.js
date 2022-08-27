#!/usr/bin/env node
const { QueueAdapterAccessorRunner, getLoggerFor } = require("../dist");

const main = async () => {
  const runner = new QueueAdapterAccessorRunner()
  const { app, queueAdapter, env: { queueName } } = await runner.run(process);
  const logger = getLoggerFor('Delete queue');
  try {
    await queueAdapter.deleteQueue(queueName);
    logger.info(`Successfully deleted the ${queueName} queue.`);
  } finally {
    await app.stop();
  }
};

main();