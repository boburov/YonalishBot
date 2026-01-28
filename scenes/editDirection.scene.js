const { Scenes, Markup } = require("telegraf");
const { prisma } = require("../db/config");

const editDirectionScene = new Scenes.WizardScene(
  "edit_direction_scene",
  // Step 1: Main Menu
  async (ctx) => {
    // Initialize or refresh logic
    // If entered via enter(), ctx.wizard.state.directionId is set
    // If re-entering from self, we render again.
    
    // Ensure directionId
    const directionId = ctx.wizard.state.directionId;
    if (!directionId) return ctx.scene.leave();

    const direction = await prisma.direction.findUnique({ where: { id: directionId } });

    if (!direction) {
        await ctx.reply("❌ Xatolik: Yo'nalish topilmadi.");
        return ctx.scene.leave();
    }
    
    // Update state incase changed
    ctx.wizard.state.direction = direction;

    // Build Message
    const text = `✏️ <b>Yo'nalishni tahrirlash</b>\n\n` +
                 `📍 <b>Qayerdan:</b> ${direction.from}\n` +
                 `🏁 <b>Qayerga:</b> ${direction.to}`;
    
    await ctx.reply(text, {
        parse_mode: "HTML",
        ...Markup.inlineKeyboard([
            [Markup.button.callback("✏️ Edit FROM", "EDIT_FROM"), Markup.button.callback("✏️ Edit TO", "EDIT_TO")],
            [Markup.button.callback("✅ Save changes", "SAVE"), Markup.button.callback("❌ Cancel", "CANCEL")]
        ])
    });

    return ctx.wizard.next();
  },
  // Step 2: Handle Menu Action or Edit Input
  async (ctx) => {
      // If we are waiting for INPUT for a specific field, handle it.
      if (ctx.wizard.state.editingField) {
          if (ctx.message && ctx.message.text) {
              const newValue = ctx.message.text;
              const field = ctx.wizard.state.editingField;
              
              // Apply change to DB immediately? 
              // Requirement: "Selected direction -> show current ... -> Save changes"
              // Typically implies changes are staged. But easier to do transactional update on Save.
              // Let's stage them in state.
              
              const currentDir = ctx.wizard.state.direction;
              // Mock update in state
              if (field === 'from') currentDir.from = newValue;
              if (field === 'to') currentDir.to = newValue;
              
              ctx.wizard.state.direction = currentDir; // Update state ref
              ctx.wizard.state.editingField = null; // Reset mode
              
              // Re-render menu
              return ctx.wizard.steps[0](ctx);
          } else {
             await ctx.reply("Iltimos, matn yuboring.");
             return;
          }
      }

      if (!ctx.callbackQuery) return; 
      const action = ctx.callbackQuery.data;
      await ctx.answerCbQuery();
      
      if (action === "EDIT_FROM") {
          ctx.wizard.state.editingField = 'from';
          await ctx.reply(`<b>"${ctx.wizard.state.direction.from}"</b> ni o'zgartirish uchun yangi nom kiriting:`, { parse_mode: "HTML" });
          return; // Stay in this step to catch input
      }
      
      if (action === "EDIT_TO") {
          ctx.wizard.state.editingField = 'to';
           await ctx.reply(`<b>"${ctx.wizard.state.direction.to}"</b> ni o'zgartirish uchun yangi nom kiriting:`, { parse_mode: "HTML" });
           return;
      }
      
      if (action === "CANCEL") {
           await ctx.reply("❌ Tahrirlash bekor qilindi.");
           return ctx.scene.leave();
      }
      
      if (action === "SAVE") {
          const { id, from, to } = ctx.wizard.state.direction;
          
          try {
             await prisma.direction.update({
                 where: { id },
                 data: { from, to }
             });
             await ctx.reply(`✅ <b>O'zgarishlar saqlandi!</b>\n\n${from} ➡️ ${to}`, { parse_mode: "HTML" });
          } catch (err) {
              console.error(err);
               if (err.code === 'P2002') { 
                await ctx.reply("❌ Bunday yo'nalish allaqachon mavjud!");
                return ctx.wizard.steps[0](ctx); // Back to menu
               }
               await ctx.reply("❌ Xatolik yuz berdi.");
          }
          return ctx.scene.leave();
      }
  }
);

module.exports = editDirectionScene;
