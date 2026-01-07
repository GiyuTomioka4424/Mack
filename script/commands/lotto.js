const fs = require("fs");
const path = require("path");

const INV_PATH = path.join(__dirname, "../../data/inventory.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");

if (!fs.existsSync(INV_PATH)) fs.writeFileSync(INV_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");

module.exports = {
  config: {
    name: "lotto",
    aliases: [],
    role: 0,
    cooldown: 5,
    hasPrefix: false
  },

  run({ api, event }) {
    const { senderID, threadID } = event;

    const inventory = JSON.parse(fs.readFileSync(INV_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));

    inventory[senderID] ??= {};
    balance[senderID] ??= 0;

    /* 🎟️ CHECK LOTTO TICKET */
    if (!inventory[senderID].lotto_ticket || inventory[senderID].lotto_ticket <= 0) {
      return api.sendMessage(
        "🎟️ NO LOTTO TICKET\n\n" +
        "You need a Lotto Ticket to play.\n\n" +
        "Buy one from the shop:\n" +
        "shop buy lotto_ticket 1",
        threadID
      );
    }

    /* 🎟️ CONSUME TICKET */
    inventory[senderID].lotto_ticket -= 1;
    if (inventory[senderID].lotto_ticket <= 0) {
      delete inventory[senderID].lotto_ticket;
    }

    /* 🎲 LOTTO LOGIC */
    const win = Math.random() < 0.15; // 15% win chance
    let msg =
      "╔════════════════════╗\n" +
      "🎟️ LOTTO RESULT 🎟️\n" +
      "╚════════════════════╝\n\n";

    if (win) {
      const prize = 10000;
      balance[senderID] += prize;
      msg +=
        "🎉 JACKPOT WIN!\n\n" +
        `💰 You won: ₱${prize.toLocaleString()}`;
    } else {
      msg +=
        "💀 Better luck next time!\n\n" +
        "🎟️ Your ticket has been used.";
    }

    fs.writeFileSync(INV_PATH, JSON.stringify(inventory, null, 2));
    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));

    api.sendMessage(msg, threadID);
  }
};