const { Markup } = require("telegraf");
const { prisma } = require("../db/config");
const { pickEmojiStable, pickEmojiRandom } = require("../constants/emoji");
const chunk = require("../functions/chunker");
const regions = require("../jsons/locations.json")

function CREATE_ELON(bot) {
    bot.action("CREATE_ELON", async (ctx) => {
        try {
            await ctx.answerCbQuery();
            await ctx.scene.enter("create_elon_scene");
        } catch (err) {
            console.error(err);
            await ctx.reply("❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.");
        }
    });

    // Old handlers removed as they are now in the scene
}



module.exports = CREATE_ELON;
