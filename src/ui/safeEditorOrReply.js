exports.safeEditOrReply = async function safeEditOrReply(ctx, text, extra) {
    try {
        return await ctx.editMessageText(text, extra);
    } catch {
        return await ctx.reply(text, extra);
    }
};