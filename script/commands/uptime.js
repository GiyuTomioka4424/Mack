const os = require("os");

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up"],
    role: 0,
    cooldown: 3,
    hasPrefix: false
  },

  async run({ api, event }) {
    const { threadID } = event;

    const start = await api.sendMessage(
      "⏱️ Checking uptime...\n\n⬜⬜⬜⬜⬜",
      threadID
    );

    const frames = [
      "🟩⬜⬜⬜⬜",
      "🟩🟩⬜⬜⬜",
      "🟩🟩🟩⬜⬜",
      "🟩🟩🟩🟩⬜",
      "🟩🟩🟩🟩🟩"
    ];

    for (const bar of frames) {
      await sleep(500);
      api.editMessage(
        `⏱️ Checking uptime...\n\n${bar}`,
        start.messageID
      );
    }

    const totalSeconds = process.uptime();
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const memory = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);
    const cpu = os.loadavg()[0].toFixed(2);

    const msg =
      "╔════════════════════╗\n" +
      "⏱️ BOT UPTIME\n" +
      "╚════════════════════╝\n\n" +
      `🗓️ Days   : ${days}\n` +
      `🕒 Hours  : ${hours}\n` +
      `🕑 Minutes: ${minutes}\n` +
      `🕐 Seconds: ${seconds}\n\n` +
      `💾 RAM Usage: ${memory} MB\n` +
      `🖥️ CPU Load : ${cpu}\n\n` +
      "━━━━━━━━━━━━━━━━━━\n" +
      "— Macky Bot V3";

    api.editMessage(msg, start.messageID);
  }
};