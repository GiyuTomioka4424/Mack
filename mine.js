module.exports = {
  config: {
    name: "mine",
    aliases: [],
    role: 0,
    cooldown: 15,
    hasPrefix: false
  },

  async run({ api, event }) {
    const threadID = event.threadID;

    const frames = [
      "⛏️ Mining.\n▱▱▱▱▱▱▱▱▱",
      "⛏️ Mining..\n▰▱▱▱▱▱▱▱▱",
      "⛏️ Mining...\n▰▰▱▱▱▱▱▱▱",
      "⛏️ Mining....\n▰▰▰▱▱▱▱▱▱",
      "⛏️ Mining.....\n▰▰▰▰▰▰▰▰▰"
    ];

    let msg = await api.sendMessage(frames[0], threadID);

    for (let i = 1; i < frames.length; i++) {
      await new Promise(r => setTimeout(r, 700));
      await api.editMessage(frames[i], msg.messageID);
    }

    const reward = Math.floor(Math.random() * 500) + 100;

    await new Promise(r => setTimeout(r, 700));
    api.editMessage(
      `⛏️ **MINING COMPLETE** ⛏️\n\n💎 You earned: **${reward} coins**\n🪨 Keep mining to get richer!`,
      msg.messageID
    );
  }
};