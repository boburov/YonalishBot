const ADMINS = [7923503499, 6846125638];

function AdminOnly(ctx, next) {
    const userId = ctx.from?.id;

    if (!userId) return;

    if (!ADMINS.includes(userId)) {
        return ctx.reply("❌ Siz Admin Emasiz");
    }

    next()
}

module.exports = { AdminOnly, ADMINS };
