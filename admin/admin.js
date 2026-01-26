const AdminOnly = require("../middleware/adminOnly")
const { Markup } = require("telegraf")

function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
}

function Admins(bot) {

    bot.command("admin", AdminOnly, async ctx => {
        const text = ctx.from.first_name

        ctx.replyWithHTML(`👋🏻 <b>Assalomu Alaykum</b>\n<blockquote>${escapeHtml(text)}</blockquote>`, Markup.inlineKeyboard([
            [Markup.button.callback("➕ Yo'nalish Yaratish", "CREATE_DIRECTION")],
            [Markup.button.callback("🔙 Qaytish", "BACK")]
        ]))
    })

}

module.exports = Admins
