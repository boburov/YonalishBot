const { Markup } = require("telegraf");
const { prisma } = require("../../db/config");
const { CB } = require("../../constants/callback");
const { adminOnly } = require("../../middleware/admin.only");
const { setSession, getSession, clearSession, isFlow } = require("../../services/sessions");
const { safeEditOrReply } = require("../ui/safeEditorOrReply");

function adminMenuKeyboard() {
    return Markup.inlineKeyboard([
        [Markup.button.callback("📍 Locatsiyalar", CB.A_LOCATIONS)],
        [Markup.button.callback("⚙️ Settings", "A_SETTINGS")],
    ]);
}

async function renderAdminHome(ctx) {
    await safeEditOrReply(ctx, "🧠 Admin Panel", adminMenuKeyboard());
}

async function renderAdminRegions(ctx) {
    const regions = await prisma.region.findMany({ orderBy: { name: "asc" } });

    const rows = regions.map((r) => ([
        Markup.button.callback(`📍 ${r.name}`, `A_OPEN_REGION_${r.id}`),
        Markup.button.callback("✏️", `A_EDIT_REGION_${r.id}`),
        Markup.button.callback("🗑️", `A_DEL_REGION_${r.id}`),
    ]));

    await safeEditOrReply(
        ctx,
        "📍 Viloyatlar (admin):",
        Markup.inlineKeyboard([
            ...rows,
            [Markup.button.callback("➕ Viloyat qo‘shish", CB.A_ADD_REGION)],
            [Markup.button.callback("🏘️ Tuman qo‘shish", CB.A_ADD_DISTRICT)],
            [Markup.button.callback("⬅️ Orqaga", CB.A_HOME)],
        ])
    );
}

exports.registerAdminFlow = function registerAdminFlow(bot) {
    // /admin
    bot.command("admin", adminOnly, async (ctx) => {
        await ctx.reply("🧠 Admin Panel", adminMenuKeyboard());
    });

    // Admin home
    bot.action(CB.A_HOME, adminOnly, async (ctx) => {
        await ctx.answerCbQuery();
        await renderAdminHome(ctx);
    });

    // Admin regions list
    bot.action(CB.A_LOCATIONS, adminOnly, async (ctx) => {
        await ctx.answerCbQuery();
        await renderAdminRegions(ctx);
    });

    // Add region -> ask name
    bot.action(CB.A_ADD_REGION, adminOnly, async (ctx) => {
        await ctx.answerCbQuery();
        setSession(ctx.from.id, { step: "A_WAIT_REGION_CREATE_NAME" });
        await ctx.reply(
            "🏙️ Yangi viloyat nomini kiriting:\n\nMisol: Toshkent\n(/cancel bilan bekor qilasiz)"
        );
    });

    // Edit region -> ask new name
    bot.action(/A_EDIT_REGION_(.+)/, adminOnly, async (ctx) => {
        await ctx.answerCbQuery();
        const regionId = ctx.match[1];

        const region = await prisma.region.findUnique({ where: { id: regionId } });
        if (!region) return ctx.reply("⚠️ Region topilmadi.");

        setSession(ctx.from.id, { step: "A_WAIT_REGION_EDIT_NAME", data: { regionId } });
        await ctx.reply(`✏️ Hozirgi nom: ${region.name}\nYangi nomni kiriting:`);
    });

    // Delete confirm
    bot.action(/A_DEL_REGION_(.+)/, adminOnly, async (ctx) => {
        await ctx.answerCbQuery();
        const regionId = ctx.match[1];

        const region = await prisma.region.findUnique({ where: { id: regionId } });
        if (!region) return ctx.reply("⚠️ Region topilmadi.");

        await safeEditOrReply(
            ctx,
            `⚠️ *${region.name}* viloyatini o‘chirmoqchimisiz?\n\nBu amal qaytarib bo‘lmaydi.`,
            {
                parse_mode: "Markdown",
                ...Markup.inlineKeyboard([
                    [
                        Markup.button.callback("✅ Ha, o‘chirish", `A_CONFIRM_DEL_REGION_${regionId}`),
                        Markup.button.callback("❌ Bekor", CB.A_LOCATIONS),
                    ],
                ]),
            }
        );
    });

    // Delete execute
    bot.action(/A_CONFIRM_DEL_REGION_(.+)/, adminOnly, async (ctx) => {
        await ctx.answerCbQuery();
        const regionId = ctx.match[1];

        await prisma.districts.deleteMany({ where: { regionId } });
        await prisma.region.delete({ where: { id: regionId } });

        await safeEditOrReply(ctx, "✅ Viloyat o‘chirildi.");
        await ctx.telegram.sendMessage(
            ctx.chat.id,
            "📍 Yangilangan ro‘yxat:",
            Markup.inlineKeyboard([[Markup.button.callback("📍 Viloyatlar", CB.A_LOCATIONS)]])
        );
    });

    // Add district -> pick region first
    bot.action(CB.A_ADD_DISTRICT, adminOnly, async (ctx) => {
        await ctx.answerCbQuery();

        const regions = await prisma.region.findMany({ orderBy: { name: "asc" } });
        if (!regions.length) return ctx.reply("⚠️ Avval viloyat qo‘shing.");

        const rows = regions.map((r) => [Markup.button.callback(`🏙️ ${r.name}`, `A_PICK_REGION_${r.id}`)]);

        await safeEditOrReply(
            ctx,
            "🏘️ Tumanni qaysi viloyat ichiga qo‘shamiz? Tanlang:",
            Markup.inlineKeyboard([
                ...rows,
                [Markup.button.callback("⬅️ Orqaga", CB.A_LOCATIONS)],
            ])
        );

        setSession(ctx.from.id, { step: "A_WAIT_PICK_REGION_FOR_DISTRICT" });
    });

    // after picking region -> ask district name
    bot.action(/A_PICK_REGION_(.+)/, adminOnly, async (ctx) => {
        await ctx.answerCbQuery();
        const regionId = ctx.match[1];

        setSession(ctx.from.id, { step: "A_WAIT_DISTRICT_CREATE_NAME", data: { regionId } });
        await ctx.reply("🏘️ Tuman nomini kiriting:\n\nMisol: Chilonzor\n(/cancel bilan bekor qilasiz)");
    });

    // Admin text handler (only admin session steps)
    bot.on("text", adminOnly, async (ctx) => {
        const uid = ctx.from.id;
        const sess = getSession(uid);
        if (!isFlow(sess, "A_")) return;

        const text = ctx.message.text.trim();
        if (!text) return;

        if (text === "/cancel") {
            clearSession(uid);
            return ctx.reply("✅ Bekor qilindi.");
        }

        if (sess.step === "A_WAIT_REGION_CREATE_NAME") {
            const created = await prisma.region.create({ data: { name: text } });
            clearSession(uid);
            await ctx.reply(`✅ Viloyat yaratildi: ${created.name}`);
            return;
        }

        if (sess.step === "A_WAIT_REGION_EDIT_NAME") {
            const regionId = sess.data?.regionId;
            if (!regionId) {
                clearSession(uid);
                return ctx.reply("⚠️ Xatolik: region topilmadi.");
            }

            const updated = await prisma.region.update({
                where: { id: regionId },
                data: { name: text },
            });

            clearSession(uid);
            await ctx.reply(`✅ Yangilandi: ${updated.name}`);
            return;
        }

        if (sess.step === "A_WAIT_DISTRICT_CREATE_NAME") {
            const regionId = sess.data?.regionId;
            if (!regionId) {
                clearSession(uid);
                return ctx.reply("⚠️ Xatolik: region topilmadi.");
            }

            const created = await prisma.districts.create({
                data: { name: text, regionId },
            });

            clearSession(uid);
            await ctx.reply(`✅ Tuman yaratildi: ${created.name}`);
            return;
        }
    });
};
