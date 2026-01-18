const { createBot } = require("./bot");

const bot = createBot();

bot.launch(() => console.log("✅ Bot ishlamoqda"));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
