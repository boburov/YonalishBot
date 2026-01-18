const { Telegraf } = require("telegraf");
require("dotenv").config();

const { registerAdminFlow } = require("./src/flows/admin");
const { registerUserFlow } = require("./src/flows/user");

exports.createBot = function createBot() {
    const bot = new Telegraf(process.env.BOT_TOKEN);

    registerUserFlow(bot);
    registerAdminFlow(bot);

    return bot;
};
