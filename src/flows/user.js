const { Markup } = require("telegraf");
const { prisma } = require("../../db/config");
const { CB } = require("../../constants/callback");
const { pickEmojiStable } = require("../../constants/emoji");
const { setSession, getSession, clearSession, isFlow } = require("../../services/sessions");
const { safeEditOrReply } = require("../ui/safeEditorOrReply");
const { toTwoColumns, contactKb, removeKb } = require("../ui/keyboeard");

const must = (v, name) => {
    if (typeof v !== "string" && !(v instanceof RegExp)) {
        console.log("❌ BAD TRIGGER:", name, v);
        throw new Error(`Invalid trigger: ${name} = ${v}`);
    }
};

must(CB?.U_LOCATIONS, "CB.U_LOCATIONS");
must(CB?.U_CREATE_ELON, "CB.U_CREATE_ELON");
must(CB?.U_CANCEL_ELON, "CB.U_CANCEL_ELON");


async function renderRegionsTwoCols(prefix, regions) {
    const flat = regions.map((r) =>
        Markup.button.callback(`${pickEmojiStable(r.id)} ${r.name}`, `${prefix}_${r.id}`)
    );
    return toTwoColumns(flat);
}

exports.registerUserFlow = function registerUserFlow(bot) {
    // START
    bot.start(async (ctx) => {
        await ctx.reply(
            `👋 Assalomu alaykum!\n🚕 Taxi e'lon botiga xush kelibsiz!`,
            Markup.inlineKeyboard([
                [Markup.button.callback("📝 E'lon berish", CB.U_CREATE_ELON)],
                [Markup.button.callback("📍 Locatsiyalarni ko‘rish", CB.U_LOCATIONS)],
            ])
        );
    });

    // User browse locations (read-only)
    bot.action(CB.U_LOCATIONS, async (ctx) => {
        await ctx.answerCbQuery();

        const regions = await prisma.region.findMany({ orderBy: { name: "asc" } });
        if (!regions.length) return safeEditOrReply(ctx, "⚠️ Hali viloyatlar yo‘q.");

        const rows = await renderRegionsTwoCols("U_REGION", regions);

        await safeEditOrReply(
            ctx,
            "📍 Viloyatlar:",
            Markup.inlineKeyboard([
                ...rows,
                [Markup.button.callback("⬅️ Orqaga", "U_BACK_START")],
            ])
        );
    });

    bot.action("U_BACK_START", async (ctx) => {
        await ctx.answerCbQuery();
        await safeEditOrReply(
            ctx,
            `👋 Assalomu alaykum!\n🚕 Taxi e'lon botiga xush kelibsiz!`,
            Markup.inlineKeyboard([
                [Markup.button.callback("📝 E'lon berish", CB.U_CREATE_ELON)],
                [Markup.button.callback("📍 Locatsiyalarni ko‘rish", CB.U_LOCATIONS)],
            ])
        );
    });

    // Start elon flow: pick FROM region
    bot.action(CB.U_CREATE_ELON, async (ctx) => {
        await ctx.answerCbQuery();

        setSession(ctx.from.id, { step: "U_WAIT_FROM_REGION", data: {} });

        const regions = await prisma.region.findMany({ orderBy: { name: "asc" } });
        if (!regions.length) return ctx.reply("⚠️ Hali regionlar yo‘q. Admin region qo‘shishi kerak.");

        const rows = await renderRegionsTwoCols("U_FROM_REGION", regions);

        await safeEditOrReply(
            ctx,
            "📝 E’lon berish\n\n📍 Qayerdan (viloyat) tanlang:",
            Markup.inlineKeyboard([
                ...rows,
                [Markup.button.callback("❌ Bekor qilish", CB.U_CANCEL_ELON)],
            ])
        );
    });

    // Cancel elon
    bot.action(CB.U_CANCEL_ELON, async (ctx) => {
        await ctx.answerCbQuery();
        clearSession(ctx.from.id);
        await safeEditOrReply(ctx, "❌ E’lon berish bekor qilindi.");
    });

    // FROM region -> pick FROM district
    bot.action(/U_FROM_REGION_(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        const uid = ctx.from.id;

        const sess = getSession(uid);
        if (!isFlow(sess, "U_")) return;

        const regionId = ctx.match[1];

        const districts = await prisma.districts.findMany({
            where: { regionId },
            orderBy: { name: "asc" },
        });

        if (!districts.length) return ctx.reply("⚠️ Bu viloyatda tumanlar yo‘q. Admin tuman qo‘shishi kerak.");

        sess.step = "U_WAIT_FROM_DISTRICT";
        sess.data.fromRegionId = regionId;
        setSession(uid, sess);

        const rows = toTwoColumns(
            districts.map((d) => Markup.button.callback(`🏘️ ${d.name}`, `U_FROM_DISTRICT_${d.id}`))
        );

        await safeEditOrReply(
            ctx,
            "📍 Qayerdan (tuman) tanlang:",
            Markup.inlineKeyboard([
                ...rows,
                [Markup.button.callback("❌ Bekor", CB.U_CANCEL_ELON)],
            ])
        );
    });

    // FROM district -> pick TO region
    bot.action(/U_FROM_DISTRICT_(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        const uid = ctx.from.id;

        const sess = getSession(uid);
        if (!isFlow(sess, "U_")) return;

        sess.data.fromDistrictId = ctx.match[1];
        sess.step = "U_WAIT_TO_REGION";
        setSession(uid, sess);

        const regions = await prisma.region.findMany({ orderBy: { name: "asc" } });
        const rows = await renderRegionsTwoCols("U_TO_REGION", regions);

        await safeEditOrReply(
            ctx,
            "🏁 Qayerga (viloyat) tanlang:",
            Markup.inlineKeyboard([
                ...rows,
                [Markup.button.callback("❌ Bekor", CB.U_CANCEL_ELON)],
            ])
        );
    });

    // TO region -> pick TO district
    bot.action(/U_TO_REGION_(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        const uid = ctx.from.id;

        const sess = getSession(uid);
        if (!isFlow(sess, "U_")) return;

        const regionId = ctx.match[1];

        const districts = await prisma.districts.findMany({
            where: { regionId },
            orderBy: { name: "asc" },
        });

        if (!districts.length) return ctx.reply("⚠️ Bu viloyatda tumanlar yo‘q.");

        sess.data.toRegionId = regionId;
        sess.step = "U_WAIT_TO_DISTRICT";
        setSession(uid, sess);

        const rows = toTwoColumns(
            districts.map((d) => Markup.button.callback(`🏘️ ${d.name}`, `U_TO_DISTRICT_${d.id}`))
        );

        await safeEditOrReply(
            ctx,
            "🏁 Qayerga (tuman) tanlang:",
            Markup.inlineKeyboard([
                ...rows,
                [Markup.button.callback("❌ Bekor", CB.U_CANCEL_ELON)],
            ])
        );
    });

    // TO district -> ask phone
    bot.action(/U_TO_DISTRICT_(.+)/, async (ctx) => {
        await ctx.answerCbQuery();
        const uid = ctx.from.id;

        const sess = getSession(uid);
        if (!isFlow(sess, "U_")) return;

        sess.data.toDistrictId = ctx.match[1];
        sess.step = "U_WAIT_PHONE";
        setSession(uid, sess);

        await ctx.reply("📞 Telefon raqamingizni yuboring:", contactKb());
    });

    // Receive contact -> save elon
    bot.on("contact", async (ctx) => {
        const uid = ctx.from.id;
        const sess = getSession(uid);
        if (!isFlow(sess, "U_") || sess.step !== "U_WAIT_PHONE") return;

        const phone = ctx.message.contact.phone_number;

        const fromDistrict = await prisma.districts.findUnique({ where: { id: sess.data.fromDistrictId } });
        const toDistrict = await prisma.districts.findUnique({ where: { id: sess.data.toDistrictId } });

        const username = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;

        const created = await prisma.elon.create({
            data: {
                username,
                phone,
                from: fromDistrict?.name ?? "Unknown",
                to: toDistrict?.name ?? "Unknown",
            },
        });

        clearSession(uid);

        await ctx.reply(
            `✅ E’lon joylandi!\n\n📍 ${created.from} ➜ ${created.to}\n📞 ${created.phone}\n👤 ${created.username ?? "-"}`,
            removeKb()
        );
    });
};
