const { Markup } = require("telegraf");
const AdminOnly = require("../middleware/adminOnly");

function startCommmand(bot) {
    bot.start(AdminOnly, async (ctx) => {
        await ctx.reply(
            `👋 Assalomu alaykum!\n🚕 Taxi e'lon botiga xush kelibsiz!`,
            Markup.inlineKeyboard([
                [Markup.button.callback("📝 E'lon berish", "CREATE_ELON")],
                [Markup.button.callback("📍 Joylashuvlarni ko‘rish", "ALL_LOCATION")]
            ])
        );
    });
}

module.exports = startCommmand;
