require("dotenv").config();
const { Telegraf, Markup } = require("telegraf");
const { connectDB, disconnectDB, prisma } = require("./db/config");

const bot = new Telegraf(process.env.BOT_TOKEN);

const LOCATIONS = [
    { name: "🏙️ Toshkent", slug: "toshkent" },
    { name: "🕌 Samarqand", slug: "samarqand" },
    { name: "🌿 Farg'ona", slug: "fargona" },
    { name: "⛰️ Andijon", slug: "andijon" },
];

const session = new Map();

function mainMenu() {
    return Markup.inlineKeyboard([
        [Markup.button.callback("📝 E'lon berish", "ELON_START")],
        [Markup.button.callback("📍 Lokatsiyalar", "SHOW_LOCS")],
    ]);
}

function locKeyboard() {
    const rows = [];
    for (let i = 0; i < LOCATIONS.length; i += 2) {
        rows.push(
            LOCATIONS.slice(i, i + 2).map((l) =>
                Markup.button.callback(l.name, `LOC_${l.slug}`)
            )
        );
    }
    rows.push([Markup.button.callback("⬅️ Orqaga", "BACK_MENU")]);
    return Markup.inlineKeyboard(rows);
}

function safeUserName(ctx) {
    const n = ctx.from?.first_name || "Foydalanuvchi";
    const u = ctx.from?.username ? `@${ctx.from.username}` : "";
    return `${n} ${u}`.trim();
}

async function ensureUser(ctx) {
    const tgUserId = BigInt(ctx.from.id);
    const name = ctx.from.first_name || null;
    const username = ctx.from.username || null;

    return prisma.user.upsert({
        where: { tgUserId },
        update: { name, username },
        create: { tgUserId, name, username },
    });
}

function resetSession(tgUserId) {
    session.delete(tgUserId);
}

// ✅ Admin command: /setgroup toshkent
bot.command("setgroup", async (ctx) => {
    const adminId = process.env.ADMIN_TG_ID ? BigInt(process.env.ADMIN_TG_ID) : null;
    if (adminId && BigInt(ctx.from.id) !== adminId) {
        return ctx.reply("⛔️ Bu buyruq faqat admin uchun.");
    }

    if (!["group", "supergroup", "channel"].includes(ctx.chat.type)) {
        return ctx.reply("⚠️ Bu buyruqni guruh/kanalda ishlating.");
    }

    const parts = ctx.message.text.split(" ").map(s => s.trim()).filter(Boolean);
    const slug = parts[1];
    if (!slug) {
        return ctx.reply("✅ Format: /setgroup toshkent");
    }

    // location upsert
    const locName = LOCATIONS.find(l => l.slug === slug)?.name?.replace(/^[^\w]+/g, "") ?? slug;

    const location = await prisma.location.upsert({
        where: { slug },
        update: { name: locName },
        create: { slug, name: locName },
    });

    const tgChatId = BigInt(ctx.chat.id);

    await prisma.group.upsert({
        where: { tgChatId },
        update: { isActive: true, title: ctx.chat.title || null, locationId: location.id },
        create: {
            tgChatId,
            title: ctx.chat.title || null,
            username: ctx.chat.username || null,
            locationId: location.id,
            isActive: true,
        },
    });

    return ctx.reply(`✅ Ulandi!\n📍 Lokatsiya: ${slug}\n👥 Chat ID: ${ctx.chat.id}`);
});

bot.start(async (ctx) => {
    resetSession(ctx.from.id);
    await ctx.reply(
        "👋 Assalomu alaykum!\n\n🚕 Taxi e'lon botiga xush kelibsiz!\n👇 Tanlang:",
        mainMenu()
    );
});

bot.action("BACK_MENU", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText("🏠 Bosh menyu:", mainMenu());
});

bot.action("SHOW_LOCS", async (ctx) => {
    await ctx.answerCbQuery();
    await ctx.editMessageText("📍 Lokatsiyani tanlang:", locKeyboard());
});

bot.action("ELON_START", async (ctx) => {
    await ctx.answerCbQuery();
    session.set(ctx.from.id, { step: "choose_location" });
    await ctx.editMessageText("📝 E’lon berish\n\n📍 Lokatsiyani tanlang:", locKeyboard());
});

bot.action(/^LOC_(.+)$/, async (ctx) => {
    await ctx.answerCbQuery();
    const slug = ctx.match[1];
    session.set(ctx.from.id, { step: "ask_from", locationSlug: slug });

    const locName = LOCATIONS.find(l => l.slug === slug)?.name ?? slug;

    await ctx.reply(
        `✅ Lokatsiya: ${locName}\n\n🧭 Qayerdan? (yozing)\nMasalan: Chilonzor`,
        Markup.keyboard([["❌ Bekor qilish"]]).resize().oneTime()
    );
});

bot.hears("❌ Bekor qilish", async (ctx) => {
    resetSession(ctx.from.id);
    await ctx.reply("🚫 Bekor qilindi.", mainMenu());
});

bot.on("text", async (ctx) => {
    const s = session.get(ctx.from.id);
    if (!s?.step) return;

    const text = ctx.message.text.trim();

    if (s.step === "ask_from") {
        s.fromText = text;
        s.step = "ask_to";
        session.set(ctx.from.id, s);
        return ctx.reply("🎯 Qayerga? (yozing)\nMasalan: Yunusobod");
    }

    if (s.step === "ask_to") {
        s.toText = text;
        s.step = "confirm";
        session.set(ctx.from.id, s);

        const locName = LOCATIONS.find(l => l.slug === s.locationSlug)?.name ?? s.locationSlug;

        return ctx.reply(
            "🧷 E’lon tayyor:\n\n" +
            `📍 ${locName}\n` +
            `🧭 Qayerdan: ${s.fromText}\n` +
            `🎯 Qayerga: ${s.toText}\n\n` +
            "Yuboramizmi?",
            Markup.inlineKeyboard([
                [Markup.button.callback("✅ Yuborish", "SEND_ORDER")],
                [Markup.button.callback("❌ Bekor", "CANCEL_ORDER")],
            ])
        );
    }
});

bot.action("CANCEL_ORDER", async (ctx) => {
    await ctx.answerCbQuery();
    resetSession(ctx.from.id);
    await ctx.reply("🚫 Bekor qilindi.", mainMenu());
});

bot.action("SEND_ORDER", async (ctx) => {
    await ctx.answerCbQuery();

    const s = session.get(ctx.from.id);
    if (!s || s.step !== "confirm") return;

    // 1) User upsert
    const user = await ensureUser(ctx);

    // 2) Shu lokatsiya uchun aktiv group topamiz
    const location = await prisma.location.findUnique({
        where: { slug: s.locationSlug },
        include: { groups: { where: { isActive: true }, take: 1 } },
    });

    const group = location?.groups?.[0];
    if (!group) {
        resetSession(ctx.from.id);
        return ctx.reply(
            "⚠️ Bu lokatsiya uchun kanal/guruh ulanmagan.\n" +
            "Admin guruhda /setgroup toshkent qilib ulab qo‘ysin."
        );
    }

    const locName = LOCATIONS.find(l => l.slug === s.locationSlug)?.name ?? s.locationSlug;

    const msg =
        "🚕 *TAXI KERAK*\n" +
        "━━━━━━━━━━━━━━\n" +
        `📍 Lokatsiya: *${locName}*\n` +
        `🧭 Qayerdan: *${s.fromText}*\n` +
        `🎯 Qayerga: *${s.toText}*\n` +
        "━━━━━━━━━━━━━━\n" +
        `👤 Murojaat: *${safeUserName(ctx)}*`;

    // 3) DB’da order yaratamiz
    const order = await prisma.order.create({
        data: {
            fromText: s.fromText,
            toText: s.toText,
            status: "PENDING",
            userId: user.id,
            groupId: group.id,
        },
    });

    // 4) Guruh/kanalga yuboramiz
    const sent = await bot.telegram.sendMessage(group.tgChatId.toString(), msg, {
        parse_mode: "Markdown",
    });

    // 5) status update
    await prisma.order.update({
        where: { id: order.id },
        data: {
            status: "SENT",
            sentMessageId: sent.message_id,
            sentAt: new Date(),
        },
    });

    resetSession(ctx.from.id);
    await ctx.reply("✅ E’lon kanalingizga yuborildi!", mainMenu());
});

(async () => {
    await connectDB();
    await bot.launch();
    console.log("✅ Bot ishga tushdi");

    const shutdown = async (signal) => {
        console.log(`\n${signal} received. Shutting down...`);
        await bot.stop(signal);
        await disconnectDB();
        process.exit(0);
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
})();
