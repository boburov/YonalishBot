const { Markup } = require("telegraf");
const { prisma } = require("../db/config");

function getUserLocation(bot) {
    // User picked FROM region
    bot.action(/^FROM_(.+)$/, async (ctx) => {
        try {
            const id = ctx.match[1];
            await ctx.answerCbQuery();

            const region = await prisma.region.findUnique({ where: { id } });
            if (!region) return ctx.reply("❌ Hudud topilmadi. Qaytadan urinib ko‘ring.");

            await ctx.reply(
                `✅ Siz ${region.name}dan yo‘lga chiqmoqchisiz.\n\n📍 Endi qayerga bormoqchisiz? Pastdagi tugmani bosing.`,
                Markup.inlineKeyboard([[Markup.button.callback("📍 Boradigan manzilni tanlash", "SET_LOCATION")]])
            );
        } catch (err) {
            console.error(err);
            await ctx.reply("❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.");
        }
    });

    // User picked TO region
    bot.action(/^TO_(.+)$/, async (ctx) => {
        try {
            const id = ctx.match[1];
            await ctx.answerCbQuery();

            const region = await prisma.region.findUnique({ where: { id } });
            if (!region) return ctx.reply("❌ Manzil topilmadi. Qaytadan urinib ko‘ring.");

            await ctx.reply(
                `✅ Boradigan manzil: ${region.name}\n\n📨 So‘rovingiz qabul qilindi. Tez orada siz bilan bog‘lanishadi.`
            );
        } catch (err) {
            console.error(err);
            await ctx.reply("❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.");
        }
    });
}

module.exports = getUserLocation;
