const cron = require("node-cron");

function scheduleJob(time, task) {
  cron.schedule(time, task);
}

module.exports = { scheduleJob };