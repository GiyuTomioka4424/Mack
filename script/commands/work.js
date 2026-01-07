const fs = require("fs");
const path = require("path");

const USERS_PATH = path.join(__dirname, "../../data/users.json");
const BAL_PATH = path.join(__dirname, "../../data/balance.json");
const WORK_PATH = path.join(__dirname, "../../data/work.json");

const COOLDOWN = 5 * 60 * 1000; // 5 minutes
const MIN_PAY = 300;
const MAX_PAY = 1200;

/* ================= INIT FILES ================= */
if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, "{}");
if (!fs.existsSync(BAL_PATH)) fs.writeFileSync(BAL_PATH, "{}");
if (!fs.existsSync(WORK_PATH)) fs.writeFileSync(WORK_PATH, "{}");

/* ================= JOBS ================= */
const JOBS = [
  "🧑‍🍳 Cooked meals",
  "🧹 Cleaned offices",
  "📦 Delivered packages",
  "🧑‍🔧 Fixed machines",
  "📊 Did office work",
  "🚚 Drove deliveries",
  "🎨 Designed posters",
  "💻 Coded websites"
];

module.exports = {
  config: {
    name: "work",
    aliases: [],
    cooldown: 2,
    hasPrefix: false
  },

  run({ api, event }) {
    const { senderID, threadID } = event;

    const users = JSON.parse(fs.readFileSync(USERS_PATH));
    const balance = JSON.parse(fs.readFileSync(BAL_PATH));
    const workData = JSON.parse(fs.readFileSync(WORK_PATH));

    /* 📝 REGISTER CHECK */
    if (!users[senderID]) {
      return api.sendMessage(
        "📝 You must register first.\nUse: register <name>",
        threadID
      );
    }

    balance[senderID] = Number(balance[senderID]) || 0;

    const now = Date.now();
    const lastWork = workData[senderID] || 0;

    /* ⏳ COOLDOWN CHECK */
    if (now - lastWork < COOLDOWN) {
      const left = COOLDOWN - (now - lastWork);
      const min = Math.floor(left / 60000);
      const sec = Math.floor((left % 60000) / 1000);

      return api.sendMessage(
        "╔════════════════════╗\n" +
        "⏳ WORK COOLDOWN\n" +
        "╚════════════════════╝\n\n" +
        `Try again in ${min}m ${sec}s.`,
        threadID
      );
    }

    /* 💰 PAYOUT */
    const salary =
      Math.floor(Math.random() * (MAX_PAY - MIN_PAY + 1)) + MIN_PAY;

    const job = JOBS[Math.floor(Math.random() * JOBS.length)];

    balance[senderID] += salary;
    workData[senderID] = now;

    fs.writeFileSync(BAL_PATH, JSON.stringify(balance, null, 2));
    fs.writeFileSync(WORK_PATH, JSON.stringify(workData, null, 2));

    api.sendMessage(
      "╔════════════════════╗\n" +
      "💼 WORK COMPLETED\n" +
      "╚════════════════════╝\n\n" +
      `${job}\n\n` +
      `💰 Earned: ₱${salary.toLocaleString()}\n\n` +
      "🕒 Cooldown: 5 minutes",
      threadID
    );
  }
};