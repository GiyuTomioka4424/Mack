const RESTART_PATH = path.join(__dirname, "data", "restart.json");

if (fs.existsSync(RESTART_PATH)) {
  try {
    const restartInfo = JSON.parse(fs.readFileSync(RESTART_PATH));

    api.sendMessage(
      "✅ Bot successfully restarted!\n\n" +
      `🕒 Time: ${new Date().toLocaleString()}\n` +
      "🟢 Status: ONLINE",
      ADMIN_UID
    );

    fs.unlinkSync(RESTART_PATH); // remove flag
  } catch (e) {
    console.log("Failed to notify admin after restart");
  }
}