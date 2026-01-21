const { Markup } = require("telegraf");
const { prisma } = require("../db/config");
const { pickEmojiStable } = require("../constants/emoji");
const chunk = require("../functions/chunker");

function ALL_LOCATION(bot) {
    bot.action("ALL_LOCATION", async (ctx) => {
        try {
            const locations = await prisma.region.findMany();

            const buttons = locations.map((region) =>
                Markup.button.callback(
                    `${pickEmojiStable(region.id)} ${region.name}`,
                    `JS_LOCATION`
                )
            );

            const keyboard = chunk(buttons, 2);
            keyboard.push([Markup.button.callback("🔙 Qaytish", "STAY_BACK")]);


            await ctx.reply("🔎 Mavjud Hududlar :", Markup.inlineKeyboard(keyboard));
        } catch (err) {
            console.error(err);
            await ctx.reply("❌ Xatolik yuz berdi");
        }
    });
}

module.exports = ALL_LOCATION;
