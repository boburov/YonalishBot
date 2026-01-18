const ADMINS = [7923503499, 6846125638]; // <- your admins

exports.adminOnly = async (ctx, next) => {
  const uid = ctx.from?.id;
  if (!uid || !ADMINS.includes(uid)) {
    return ctx.reply("⛔ You are not admin.");
  }
  return next();
};
