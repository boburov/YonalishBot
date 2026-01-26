const { Markup } = require("telegraf");
const AdminOnly = require("../middleware/adminOnly");

function startCommmand(bot) {
  bot.start(AdminOnly, async (ctx) => {
    await ctx.replyWithHTML(
      `<blockquote>— Yo'nalish Bot —\n\n🚕 Taxi E’lon Botiga Xush Kelibsiz!</blockquote>

<b>Bu yerda siz:</b>
├ 🚖 Tez va oson tarzda taxi e’lon berasiz
├ 📍 Mavjud yo‘nalishlarni ko‘rib chiqasiz
└ 🔍 Siz bilan haydovchilar bevosita bog‘lanadi


⬇️ <i>Quyidagi tugmalardan birini tanlang</i>`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback("📝 E’lon berish", "CREATE_ELON"),
          Markup.button.callback("🔍 Qidirish", "SEARCH_ELON"),
        ],
        [Markup.button.callback("📍 Yo‘nalishlar", "ALL_LOCATION")],
        [Markup.button.callback("ℹ️ Yordam", "HELP")],
      ]),
    );
  });
}

module.exports = startCommmand;
