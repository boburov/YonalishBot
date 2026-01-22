const { Markup } = require("telegraf");
const { prisma } = require("../db/config");
const sessionStorage = require("../session");

function getUserLocation(bot) {

    bot.action(/^FROM_(.+)$/, async (ctx) => {
        try {
            await ctx.answerCbQuery();

            const regionId = ctx.match[1];
            const userId = ctx.from.id;

            const region = await prisma.region.findUnique({
                where: { id: regionId },
            });

            if (!region) {
                return ctx.reply("❌ Hudud topilmadi. Qaytadan urinib ko‘ring.");
            }

            const prev = sessionStorage.get(userId) || {};
            sessionStorage.set(userId, {
                ...prev,
                from: { id: region.id, name: region.name },
                updatedAt: Date.now(),
            });

            await ctx.reply(
                `✅ Siz *${region.name}*dan yo‘lga chiqmoqchisiz.\n\n📍 Endi qayerga bormoqchisiz? Pastdagi tugmani bosing.`,
                {
                    parse_mode: "Markdown",
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback("📍 Boradigan manzilni tanlash", "SET_LOCATION")],
                    ]),
                }
            );
        } catch (err) {
            console.error(err);
            await ctx.reply("❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.");
        }
    });

    bot.action(/^TO_(.+)$/, async (ctx) => {
        try {
            await ctx.answerCbQuery();

            const regionId = ctx.match[1];
            const userId = ctx.from.id;

            const region = await prisma.region.findUnique({
                where: { id: regionId },
            });

            if (!region) {
                return ctx.reply("❌ Manzil topilmadi. Qaytadan urinib ko‘ring.");
            }

            const session = sessionStorage.get(userId);

            if (!session?.from) {
                return ctx.reply(
                    "⚠️ Avval qayerdan ketishingizni tanlang (FROM). Keyin manzil (TO) tanlaysiz."
                );
            }

            sessionStorage.set(userId, {
                ...session,
                to: { id: region.id, name: region.name },
                updatedAt: Date.now(),
            });

            await ctx.reply(
                `✅ Yo‘nalish tanlandi!\n\n` +
                `🏡 Qayerdan: *${session.from.name}*\n` +
                `📍 Qayerga: *${region.name}*\n\n` +
                `📨 So‘rovingiz qabul qilindi. Tez orada siz bilan bog‘lanishadi.`,
                { parse_mode: "Markdown" }
            );

            sessionStorage.delete(userId);

        } catch (err) {
            console.error(err);
            await ctx.reply("❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.");
        }
    });
}

module.exports = getUserLocation;
