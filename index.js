require("dotenv").config()
const { Telegraf } = require("telegraf");
const botRunner = require("./bot");

const bot = new Telegraf(process.env.BOT_TOKEN)

botRunner(bot)

bot.launch(() => {
    console.log("🤖 Bot Ishga Tushdi");
})