const { Scenes, Markup } = require("telegraf");
const { prisma } = require("../db/config");

const createDirectionScene = new Scenes.WizardScene(
  "create_direction_scene",
  // Step 1: Ask for 'From'
  async (ctx) => {
    await ctx.reply("📍 <b>Qayerdan?</b> (Viloyat yoki shahar nomini yozing)", { parse_mode: "HTML" });
    return ctx.wizard.next();
  },
  // Step 2: Ask for 'To'
  async (ctx) => {
    if (!ctx.message || !ctx.message.text) {
      await ctx.reply("❌ Iltimos, faqat matn yuboring.");
      return;
    }
    ctx.wizard.state.from = ctx.message.text;
    await ctx.reply("🏁 <b>Qayerga?</b> (Viloyat yoki shahar nomini yozing)", { parse_mode: "HTML" });
    return ctx.wizard.next();
  },
  // Step 3: Ask for 'Channels'
  async (ctx) => {
    if (!ctx.message || !ctx.message.text) {
      await ctx.reply("❌ Iltimos, faqat matn yuboring.");
      return;
    }
    ctx.wizard.state.to = ctx.message.text;
    
    await ctx.reply(
      "📢 <b>Kanallarni kiriting</b>\n\nKanal IDlarini probel yoki yangi qator bilan ajratib yozing.\nMisol: @kanal1 @kanal2", 
      { parse_mode: "HTML" }
    );
    return ctx.wizard.next();
  },
  // Step 4: Validate and Save
  async (ctx) => {
    if (!ctx.message || !ctx.message.text) {
      await ctx.reply("❌ Iltimos, kanal IDlarini matn ko'rinishida yuboring.");
      return;
    }

    const input = ctx.message.text;
    // Extract channels starting with @ or just strings, split by whitespace/newlines
    const channels = input.split(/[\s\n]+/).filter(c => c.trim().length > 0);

    if (channels.length === 0) {
      await ctx.reply("⚠️ Hech qanday kanal kiritilmadi. Iltimos, qaytadan kiriting.");
      return; // Stay in this step
    }

    const { from, to } = ctx.wizard.state;
    const uniqueChannels = [...new Set(channels)];

    try {
      // Transaction to create direction and channels
       const result = await prisma.$transaction(async (tx) => {
        // Check duplicate
        const existing = await tx.direction.findUnique({
          where: { from_to: { from, to } }
        });
        
        if (existing) {
          throw new Error("CONFLICT");
        }

        return await tx.direction.create({
          data: {
            from,
            to,
            channels: {
              create: uniqueChannels.map(cid => ({ channelId: cid }))
            }
          }
        });
      });

      await ctx.reply(
        `✅ <b>Yo'nalish yaratildi!</b>\n\n📍 ${from} ➡️ ${to}\n📢 Kanallar: ${uniqueChannels.length}`, 
        { parse_mode: "HTML" }
      );
    } catch (err) {
      console.error(err);
      if (err.message === "CONFLICT") {
        await ctx.reply("❌ Bu yo'nalish allaqachon mavjud.");
      } else {
        await ctx.reply("❌ Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.");
      }
    }

    return ctx.scene.leave();
  }
);

module.exports = createDirectionScene;
