require("dotenv").config()
const { Telegraf, Scenes, session } = require("telegraf");
const botRunner = require("./bot");
const createDirectionScene = require("./scenes/createDirection.scene");
const createElonScene = require("./scenes/createElon.scene");
const editDirectionScene = require("./scenes/editDirection.scene");

const stage = new Scenes.Stage([createDirectionScene, createElonScene, editDirectionScene]);
const bot = new Telegraf(process.env.BOT_TOKEN);

bot.use(session());
bot.use(stage.middleware());

botRunner(bot)

bot.launch(() => {
    console.log("🤖 Bot Ishga Tushdi");
})