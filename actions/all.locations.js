const { Markup } = require("telegraf");
const { pickEmojiRandom } = require("../constants/emoji");
const chunk = require("../functions/chunker");
const regions = require("../jsons/locations.json")

function ALL_LOCATION(bot) {
    bot.action("ALL_LOCATION", async (ctx) => {
        try {

            const locations = await regions.regions

            const buttons = locations.map((region) =>
                Markup.button.callback(
                    `${pickEmojiRandom()} ${region.name}`,
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
