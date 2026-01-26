const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function handleTextMessage(ctx) {
    // If there's no session or step, we don't need to do anything.
    if (!ctx.session || !ctx.session.step) {
        // You might want to add a default message here, e.g.,
        // await ctx.reply("Iltimos, avval biror amalni tanlang. /start");
        return;
    }

    const { step } = ctx.session;
    const text = ctx.message.text;

    try {
        // State machine for creating a new Direction
        if (step === "awaiting_direction_name") {
            ctx.session.newDirectionName = text;
            ctx.session.step = "awaiting_channel_id";
            await ctx.reply(`Yo'nalish nomi: "${text}"\n\nEndi ushbu yo'nalish uchun e'lonlar yuboriladigan kanalning ID'sini kiriting.\n\n(Masalan: -100123456789)`);
        } else if (step === "awaiting_channel_id") {
            const channelId = parseInt(text, 10);
            if (isNaN(channelId) || !text.startsWith('-100')) {
                await ctx.reply("Xato: Kanal ID raqamlardan iborat bo'lishi va '-100' bilan boshlanishi kerak. Iltimos, qayta kiriting.");
                return;
            }

            const directionName = ctx.session.newDirectionName;

            // Check if a direction with this name already exists
            const existingDirection = await prisma.direction.findUnique({
                where: { name: directionName }
            });

            if (existingDirection) {
                await ctx.reply(`"${directionName}" nomli yo'nalish allaqachon mavjud. Iltimos, boshqa nom tanlang.`);
                ctx.session.step = "awaiting_direction_name";
                return;
            }

            await prisma.direction.create({
                data: {
                    name: directionName,
                    channelId: channelId,
                },
            });

            await ctx.reply(`✅ Muvaffaqiyatli!\n\nYo'nalish: "${directionName}"\nKanal ID: ${channelId}\n\nYo'nalish bazaga qo'shildi.`);
            
            // Clear the session
            ctx.session = null;
        }

        // TODO: Add handler for 'awaiting_announcement_content'

    } catch (e) {
        console.error("Error in text message handler:", e);
        await ctx.reply("Xatolik yuz berdi. /start");
        // Clear the session on error
        ctx.session = null;
    }
}

module.exports = handleTextMessage;
