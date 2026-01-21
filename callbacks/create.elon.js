const { Markup } = require("telegraf");
const { prisma } = require("../db/config");
const { pickEmojiStable } = require("../constants/emoji");
const chunk = require("../functions/chunker");

function CREATE_ELON(bot) {
    bot.action("CREATE_ELON", async (ctx) => {
        try {
            await ctx.answerCbQuery();

            const locations = await prisma.region.findMany();

            const buttons = locations.map((region) =>
                Markup.button.callback(
                    `${pickEmojiStable(region.id)} ${region.name}`,
                    `FROM_${region.id}`
                )
            );

            const keyboard = chunk(buttons, 2);
            keyboard.push([Markup.button.callback("🔙 Orqaga", "STAY_BACK")]);

            await ctx.reply("🏡 Qayerdan ketmoqchisiz? Hududni tanlang:", Markup.inlineKeyboard(keyboard));
        } catch (err) {
            console.error(err);
            await ctx.reply("❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.");
        }
    });

    bot.action("SET_LOCATION", async (ctx) => {
        try {
            await ctx.answerCbQuery();

            const locations = await prisma.region.findMany();

            const buttons = locations.map((region) =>
                Markup.button.callback(
                    `${pickEmojiStable(region.id)} ${region.name}`,
                    `TO_${region.id}`
                )
            );

            const keyboard = chunk(buttons, 2);
            keyboard.push([Markup.button.callback("🔙 Orqaga", "STAY_BACK")]);

            await ctx.reply("📍 Qayerga bormoqchisiz? Manzilni tanlang:", Markup.inlineKeyboard(keyboard));
        } catch (err) {
            console.error(err);
            await ctx.reply("❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.");
        }
    });
}

module.exports = CREATE_ELON;
