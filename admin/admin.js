const { AdminOnly } = require("../middleware/adminOnly")
const { Markup } = require("telegraf")

function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function Admins(bot) {

const { prisma } = require("../db/config")

    bot.command("admin", AdminOnly, async ctx => {
        const text = ctx.from.first_name || "Admin"

        ctx.replyWithHTML(`👋🏻 <b>Assalomu Alaykum, ${escapeHtml(text)}</b>\n\nAdmin panelga xush kelibsiz.`, Markup.inlineKeyboard([
            [Markup.button.callback("➕ Yo'nalish Yaratish", "CREATE_DIRECTION")],
            [Markup.button.callback("📋 Yo'nalishlar Ro'yxati", "LIST_DIRECTIONS")],
            [Markup.button.callback("🔙 Chiqish", "BACK")]
        ]))
    })

    // Enter Wizard Scene
    bot.action("CREATE_DIRECTION", AdminOnly, async ctx => {
        await ctx.answerCbQuery();
        await ctx.scene.enter("create_direction_scene");
    })

    // List Directions
    bot.action("LIST_DIRECTIONS", AdminOnly, async ctx => {
      await ctx.answerCbQuery();
      
      const directions = await prisma.direction.findMany({
        include: { channels: true },
        orderBy: { from: 'asc' }
      });

      if (directions.length === 0) {
        return ctx.reply("⚠️ Hozircha yo'nalishlar mavjud emas.");
      }

      for (const d of directions) {
        const channelList = d.channels.map(c => c.channelId).join(", ");
        await ctx.replyWithHTML(
          `📍 <b>${d.from} ➡️ ${d.to}</b>\n📢 Kanallar: ${channelList}`,
          Markup.inlineKeyboard([
            [Markup.button.callback("✏️ Tahrirlash", `EDIT_DIRECTION_${d.id}`)],
            [Markup.button.callback("🗑 O'chirish", `DELETE_DIRECTION_${d.id}`)]
          ])
        );
      }
    })

    // Edit Direction
    bot.action(/EDIT_DIRECTION_(.+)/, AdminOnly, async ctx => {
        const id = ctx.match[1];
        try {
            await ctx.answerCbQuery();
            // Pass state to the scene
            await ctx.scene.enter("edit_direction_scene", { directionId: id });
        } catch (err) {
            console.error(err);
            await ctx.reply("❌ Xatolik yuz berdi.");
        }
    })

    // Delete Direction
    bot.action(/DELETE_DIRECTION_(.+)/, AdminOnly, async ctx => {
      const id = ctx.match[1];
      try {
        await prisma.$transaction(async (tx) => {
            // Delete channels first (cascade)
            await tx.channel.deleteMany({ where: { directionId: id } });
            // Delete direction
            await tx.direction.delete({ where: { id } });
        });
        await ctx.answerCbQuery("✅ Yo'nalish o'chirildi");
        await ctx.deleteMessage(); // Delete the message with the button
      } catch (err) {
        console.error(err);
        await ctx.answerCbQuery("❌ Xatolik yuz berdi", { show_alert: true });
      }
    })

    // Back / Exit
    bot.action("BACK", async ctx => {
        await ctx.answerCbQuery();
        await ctx.deleteMessage();
    })

}

module.exports = Admins
