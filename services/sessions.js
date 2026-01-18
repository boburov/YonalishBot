const ADMINS = [7923503499, 6846125638];

function adminOnly(ctx, next) {
    const uid = ctx.from?.id;
    if (!uid || !ADMINS.includes(uid)) {
        return ctx.reply("⛔ You are not admin.");
    }
    return next();
}

const sessions = new Map();

function setSession(uid, payload) {
    sessions.set(uid, payload);
}
function getSession(uid) {
    return sessions.get(uid);
}
function clearSession(uid) {
    sessions.delete(uid);
}
function isFlow(sess, prefix) {
    return !!sess?.step?.startsWith(prefix);
}

module.exports = { setSession, getSession, clearSession, isFlow, adminOnly };