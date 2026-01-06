const { sleep } = require("../../utils/animate");

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up"],
    cooldown: 5,
    hasPrefix: false
  },

  async run({ api, event }) {
    const { threadID } = event;

    const start = process.uptime();
    const days = Math.floor(start / 86400);
    const hours = Math.floor((start % 86400) / 3600);
    const minutes = Math.floor((start % 3600) / 60);
    const seconds = Math.floor(start % 60);

    // STEP 1: Send initial message
    const msgID = await api.sendMessage("⏳ Checking uptime.", threadID);

    // STEP 2: Animate safely (FINITE)
    await sleep(600);
    api.editMessage("⏳ Checking uptime..", msgID);

    await sleep(600);
    api.editMessage("⏳ Checking uptime...", msgID);

    await sleep(600);

    // STEP 3: Final result (STOP HERE)
    api.editMessage(
      "╔════════════════════╗\n" +
      "⏱️ BOT UPTIME\n" +
      "╚════════════════════╝\n\n" +
      `🗓️ ${days} day(s)\n` +
      `⏰ ${hours} hour(s)\n` +
      `⏳ ${minutes} minute(s)\n` +
      `⌛ ${seconds} second(s)\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "— Macky Bot V3",
      msgID
    );
  }
};