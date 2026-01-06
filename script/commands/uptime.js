module.exports = {
  config: {
    name: "uptime",
    aliases: ["up"],
    cooldown: 3,
    hasPrefix: false
  },

  async run({ api, event }) {
    try {
      // Step 1: instant feedback
      api.sendMessage("⏳ Checking uptime...", event.threadID);

      // Step 2: very short delay (non-blocking)
      await new Promise(r => setTimeout(r, 500));

      // Step 3: calculate uptime
      const uptime = process.uptime();
      const h = Math.floor(uptime / 3600);
      const m = Math.floor((uptime % 3600) / 60);
      const s = Math.floor(uptime % 60);

      // Step 4: final message
      api.sendMessage(
        `🟢 Bot Uptime\n⏱ ${h}h ${m}m ${s}s`,
        event.threadID
      );

    } catch (e) {
      api.sendMessage("⚠️ Failed to get uptime.", event.threadID);
    }
  }
};