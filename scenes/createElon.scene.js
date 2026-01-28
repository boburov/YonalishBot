const { Scenes, Markup } = require("telegraf");
const { prisma } = require("../db/config");

// Format the announcement message
const formatAnnouncement = ({ direction, price, date, contact, description }) => {
    let msg = `🚕 <b>Yangi E'lon</b>\n\n`;
    msg += `📍 <b>Yo'nalish:</b> ${direction.from} ➡️ ${direction.to}\n`;
    if (price) msg += `💰 <b>Narxi:</b> ${price}\n`;
    if (date) msg += `📅 <b>Vaqti:</b> ${date}\n`;
    msg += `📞 <b>Aloqa:</b> ${contact}\n`;
    if (description) msg += `📝 <b>Izoh:</b> ${description}\n`;
    msg += `\n🕐 ${new Date().toLocaleString('uz-UZ')}\n`;
    msg += `\n#${direction.from.replace(/\s/g, '')} #${direction.to.replace(/\s/g, '')}`;
    return msg;
};

const createElonScene = new Scenes.WizardScene(
    "create_elon_scene",
    // Step 1: Select From
    async (ctx) => {
        const directions = await prisma.direction.groupBy({
            by: ['from'],
            orderBy: { from: 'asc' }
        });
        
        if (directions.length === 0) {
            await ctx.reply("⚠️ Hozircha yo'nalishlar mavjud emas.");
            return ctx.scene.leave();
        }

        const buttons = directions.map(d => Markup.button.callback(d.from, `FROM_${d.from}`));
        await ctx.reply("🏡 <b>Qayerdan ketmoqchisiz?</b>", {
            parse_mode: "HTML",
            ...Markup.inlineKeyboard(chunk(buttons, 2))
        });
        return ctx.wizard.next();
    },
    // Step 2: Select To
    async (ctx) => {
        if (!ctx.callbackQuery) return;
        const from = ctx.callbackQuery.data.replace("FROM_", "");
        ctx.wizard.state.from = from;
        await ctx.answerCbQuery();

        const directions = await prisma.direction.findMany({
            where: { from },
            select: { to: true, id: true }
        });

        const buttons = directions.map(d => Markup.button.callback(d.to, `TO_${d.id}`));
        await ctx.reply("📍 <b>Qayerga bormoqchisiz?</b>", {
            parse_mode: "HTML",
            ...Markup.inlineKeyboard(chunk(buttons, 2))
        });
        return ctx.wizard.next();
    },
    // Step 3: Select Channels (Multi-Select)
    async (ctx) => {
        if (!ctx.callbackQuery && !ctx.wizard.state.directionId) return;

        let directionId;
        // If coming from Step 2
        if (ctx.callbackQuery && ctx.callbackQuery.data.startsWith("TO_")) {
           directionId = ctx.callbackQuery.data.replace("TO_", "");
           ctx.wizard.state.directionId = directionId;
           // Init selected channels
           ctx.wizard.state.selectedChannels = new Set();
           await ctx.answerCbQuery();
           
           // Fetch full direction info once
           const direction = await prisma.direction.findUnique({ where: { id: directionId } });
           ctx.wizard.state.direction = direction;
        } else {
           directionId = ctx.wizard.state.directionId;
           if (ctx.callbackQuery) await ctx.answerCbQuery();
        }

        // Handle Toggle Logic
        if (ctx.callbackQuery && ctx.callbackQuery.data.startsWith("TOGGLE_")) {
            const chId = ctx.callbackQuery.data.replace("TOGGLE_", "");
            const selected = ctx.wizard.state.selectedChannels;
            
            if (selected.has(chId)) {
                selected.delete(chId);
            } else {
                if (selected.size >= 4) {
                    await ctx.answerCbQuery("⚠️ Maksimum 4 ta kanal tanlash mumkin!", { show_alert: true });
                    return; // Don't re-render
                }
                selected.add(chId);
            }
        }
        
        // Handle Done
        if (ctx.callbackQuery && ctx.callbackQuery.data === "CHANNELS_DONE") {
            const selected = ctx.wizard.state.selectedChannels;
            if (selected.size === 0) {
                 await ctx.answerCbQuery("⚠️ Kamida 1 ta kanal tanlang!", { show_alert: true });
                 return;
            }
            // Prompt for next step: Price
             await ctx.reply("💰 <b>Narxi qancha?</b> (ixtiyoriy)", {
                parse_mode: "HTML",
                ...Markup.inlineKeyboard([[Markup.button.callback("➡️ O'tkazib yuborish", "SKIP_PRICE")]])
            });
            return ctx.wizard.next(); // Proceed to Price Handle
        }

        // Render Channels
        const channels = await prisma.channel.findMany({ where: { directionId } });

        if (channels.length === 0) {
            await ctx.reply("⚠️ Bu yo'nalishda kanallar yo'q.");
            return ctx.scene.leave();
        }

        const buttons = channels.map(ch => {
            const isSelected = ctx.wizard.state.selectedChannels.has(ch.channelId);
            const icon = isSelected ? "✅" : "☑️";
            return Markup.button.callback(`${icon} ${ch.channelId}`, `TOGGLE_${ch.channelId}`);
        });

        const keyboard = chunk(buttons, 1);
        keyboard.push([Markup.button.callback("Davom etish ➡️", "CHANNELS_DONE")]);

        // If editing existing message (toggle)
        if (ctx.callbackQuery && ctx.callbackQuery.data.startsWith("TOGGLE_")) {
             try {
                await ctx.editMessageText("📢 <b>Qaysi kanallarga yuboramiz?</b> (max 4)", {
                     parse_mode: "HTML",
                     ...Markup.inlineKeyboard(keyboard)
                });
             } catch (e) { /* ignore if not modified */ }
        } else {
            await ctx.reply("📢 <b>Qaysi kanallarga yuboramiz?</b> (max 4)", {
                parse_mode: "HTML",
                ...Markup.inlineKeyboard(keyboard)
            });
        }
    },
    // Step 4: Price
    async (ctx) => {
        // Entry from previous step is direct call, no callback or message usually effectively
        // usage of wizard.next() calls this step handler? 
        // Logic: if we are here, we finished channel selection.
        // But wait, wizard middleware calls next handler with same update if logic flows through?
        // No, wizard.next() just increments cursor. You need to wait for next update OR manually advance?
        // Standard Telegraf wizard waits for next update.
        // So I need to send the prompt for Price from the previous step? 
        // OR Use `ctx.wizard.steps[i](ctx)` pattern.
        // Actually simplest is: send prompt in previous step BEFORE wizard.next? 
        // No, previous step handles interaction.
        // Correct Pattern: Previous step handles 'Done', sends prompt for NEXT step, then wizard.next(). 
        // However, I merged interaction logic in Step 3. Let's adjust Step 3 to send prompt on DONE.
        
        // REFACTORING LOGIC MOVED TO STEP 3 "DONE" BLOCK
        
        // Wait, I cannot easily refactor strict step sequence without splitting logic.
        // Let's make Step 4 handle the prompt sending if it's the first time?
        // Easier: Step 3 handles input. If DONE, it sends prompt for Step 4 and returns ctx.wizard.next().
        // Step 4 handles Input for Price.
        
        // Let's implement Step 4 assuming it receives the Update for "Price".
        // But wait, the user just clicked "Done". The next update will be the PRICE text.
        // So Step 3 (Done) -> Send "Enter Price" -> Next.
        // Step 4 -> Handles Price Text.
        
        // BUT my structure has separate steps for Prompting usually?
        // Original code: Step 3 prompted, Step 4 handled.
        
        // Let's stick to: Step 3 is Channel Selector. On DONE, it prompts for Price and `next()`.
        // Step 4 handles Price input.
        
        if (ctx.callbackQuery && ctx.callbackQuery.data === "SKIP_PRICE") {
             ctx.wizard.state.price = null;
             await ctx.answerCbQuery();
        } else if (ctx.message && ctx.message.text) {
             ctx.wizard.state.price = ctx.message.text;
        } else {
             // First time entry? No, we prompt in Step 3.
             // But if user enters garbage?
             // Lets assume we prompt here if no input?
             // To be safe, we can use a flag or just assume prompts are done by previous steps.
             // Actually, standard pattern: 
             // Handler N: Process Input N-1. Send Prompt N.
             
             // Step 3 (Channels):
             // ... Handle Toggles ...
             // ... Handle DONE ... -> Send "Enter Price", return next().
             
             // Step 4 (Price Input):
             // ... Process Price ... -> Send "Enter Date", return next().
             
             return; 
        }

        await ctx.reply("📅 <b>Qachon ketasiz?</b> (kun va vaqt, ixtiyoriy)", {
            parse_mode: "HTML",
            ...Markup.inlineKeyboard([[Markup.button.callback("➡️ O'tkazib yuborish", "SKIP_DATE")]])
        });
        return ctx.wizard.next();
    },
    // Step 5: Date
    async (ctx) => {
        if (ctx.callbackQuery && ctx.callbackQuery.data === "SKIP_DATE") {
            ctx.wizard.state.date = null;
            await ctx.answerCbQuery();
        } else if (ctx.message && ctx.message.text) {
            ctx.wizard.state.date = ctx.message.text;
        } else {
             return;
        }

        await ctx.reply("📞 <b>Telefon raqamingiz yoki telegram username:</b>", {
             parse_mode: "HTML",
             reply_markup: {
                 keyboard: [[{ text: "📱 Raqamni yuborish", request_contact: true }]],
                 one_time_keyboard: true,
                 resize_keyboard: true
             }
        });
        return ctx.wizard.next();
    },
    // Step 6: Contact
    async (ctx) => {
         if (ctx.message) {
            if (ctx.message.contact) {
                ctx.wizard.state.contact = ctx.message.contact.phone_number;
            } else {
                ctx.wizard.state.contact = ctx.message.text;
            }
        } else {
            return;
        }

        await ctx.reply("📝 <b>Qo'shimcha izoh</b> (ixtiyoriy):", {
            parse_mode: "HTML",
            reply_markup: { remove_keyboard: true },
             ...Markup.inlineKeyboard([[Markup.button.callback("➡️ O'tkazib yuborish", "SKIP_DESC")]])
        });
        return ctx.wizard.next();
    },
    // Step 7: Description & Preview
    async (ctx) => {
        if (ctx.callbackQuery && ctx.callbackQuery.data === "SKIP_DESC") {
            ctx.wizard.state.description = null;
            await ctx.answerCbQuery();
        } else if (ctx.message && ctx.message.text) {
            ctx.wizard.state.description = ctx.message.text;
        } else {
            return;
        }

        const msg = formatAnnouncement(ctx.wizard.state);
        
        // Show selected channels count in preview
        const selectedCount = ctx.wizard.state.selectedChannels.size;
        
        await ctx.reply(msg + `\n📢 Yuboriladigan kanallar: ${selectedCount} ta`, {
            parse_mode: "HTML",
            ...Markup.inlineKeyboard([
                [Markup.button.callback("✅ E'lonni joylash", "PUBLISH")],
                [Markup.button.callback("❌ Bekor qilish", "CANCEL")]
            ])
        });
        return ctx.wizard.next();
    },
    // Step 8: Publish
    async (ctx) => {
        if (!ctx.callbackQuery) return;
        const action = ctx.callbackQuery.data;
        await ctx.answerCbQuery();

        if (action === "CANCEL") {
            await ctx.reply("❌ E'lon bekor qilindi.");
            return ctx.scene.leave();
        }

        if (action === "PUBLISH") {
            const { directionId, price, date, contact, description, selectedChannels } = ctx.wizard.state;
            const message = formatAnnouncement(ctx.wizard.state);
            const userId = String(ctx.from.id);

            try {
                // 1. Fetch Selected Channels Infos
                const channels = await prisma.channel.findMany({
                    where: { 
                        channelId: { in: Array.from(selectedChannels) },
                        directionId: directionId
                    }
                });

                if (channels.length === 0) {
                     await ctx.reply("⚠️ Xatolik: Tanlangan kanallar topilmadi.");
                     return ctx.scene.leave();
                }

                // 2. Save Announcement
                const announcement = await prisma.announcement.create({
                    data: {
                        telegramUserId: userId,
                        directionId,
                        price,
                        date,
                        contact,
                        description,
                        status: "PUBLISHED"
                    }
                });

                await ctx.reply("✅ E'loningiz qabul qilindi va kanallarga yuborilmoqda...");

                // 3. Broadcast
                let successCount = 0;
                let failCount = 0;

                for (const ch of channels) {
                    try {
                        await ctx.telegram.sendMessage(ch.channelId, message, { parse_mode: "HTML" });
                        
                        await prisma.announcementDelivery.create({
                            data: {
                                announcementId: announcement.id,
                                channelId: ch.channelId,
                                status: "SUCCESS"
                            }
                        });
                        successCount++;
                    } catch (err) {
                         console.error(`Failed to send to ${ch.channelId}:`, err);
                        await prisma.announcementDelivery.create({
                            data: {
                                announcementId: announcement.id,
                                channelId: ch.channelId,
                                status: "FAILED",
                                errorMessage: err.message
                            }
                        });
                        failCount++;
                    }
                    // Rate limiting
                    await new Promise(r => setTimeout(r, 200));
                }

                await ctx.reply(`📊 <b>Natija:</b>\n✅ Yuborildi: ${successCount}\n❌ Xatolik: ${failCount}`, { parse_mode: "HTML" });

            } catch (err) {
                console.error(err);
                await ctx.reply("❌ Tizimda xatolik yuz berdi.");
            }
        }
        return ctx.scene.leave();
    }
);

function chunk(arr, size) {
    return Array.from({ length: Math.ceil(arr.length / size) }, (v, i) =>
        arr.slice(i * size, i * size + size)
    );
}

module.exports = createElonScene;
