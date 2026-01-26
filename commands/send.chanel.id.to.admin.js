const { ADMINS } = require("../middleware/adminOnly");

function notifyAdminsOnBotChatStatus(bot) {
    bot.on("my_chat_member", async (ctx) => {
        const upd = ctx.update?.my_chat_member;
        if (!upd) return;

        const chat = upd.chat;
        const oldStatus = upd.old_chat_member?.status;
        const newStatus = upd.new_chat_member?.status;


        if (chat.type === "private") return;

        const adminIds = Array.isArray(ADMINS) ? ADMINS : [ADMINS];

        const chatName =
            chat.title ||
            [chat.first_name, chat.last_name].filter(Boolean).join(" ") ||
            "Nomsiz";

        const baseInfo =
            `🧩 Chat turi: ${chat.type}\n` +
            `📌 Nomi: ${chatName}\n` +
            `🆔 ID: ${chat.id}`;

        try {

            if (newStatus === "administrator" && oldStatus !== "administrator") {
                const text =
                    `✅ Bot admin bo‘ldi!\n` +
                    `${baseInfo}\n\n` +
                    `⚙️ Endi bot funksiyalari to‘liq ishlaydi.`;

                await Promise.all(
                    adminIds.map((id) => ctx.telegram.sendMessage(id, text))
                );
                return;
            }


            if (
                (newStatus === "kicked" || newStatus === "left") &&
                oldStatus !== newStatus
            ) {
                const text =
                    `❌ Bot chatdan olib tashlandi.\n` +
                    `${baseInfo}\n\n` +
                    `📤 Status: ${newStatus}`;

                await Promise.all(
                    adminIds.map((id) => ctx.telegram.sendMessage(id, text))
                );
                return;
            }


            if (newStatus === "member" && oldStatus === "left") {
                const text =
                    `ℹ️ Bot chatga qo‘shildi (admin emas).\n` +
                    `${baseInfo}\n\n` +
                    `🔐 To‘liq ishlashi uchun botga admin bering.`;

                await Promise.all(
                    adminIds.map((id) => ctx.telegram.sendMessage(id, text))
                );
            }
        } catch (err) {
            console.error("Adminlarga xabar yuborishda xatolik:", err);
        }
    });
}

module.exports = notifyAdminsOnBotChatStatus;
