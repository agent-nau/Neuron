import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from "discord.js";

export const name = "interactionCreate";

export async function execute(i, { warnings, verifSettings, verifCodes, joinSettings, generateCode, client }) {
  try {
    // Handle ChatInput commands
    if (i.isChatInputCommand()) {
      const command = client.commands.get(i.commandName);
      if (!command) return;

      await command.execute(i, { warnings, verifSettings, verifCodes, joinSettings });
    }

    // Handle button interactions for starting verification + opening modal
    if (i.isButton()) {
      // start verification button from panel
      if (i.customId && i.customId.startsWith("verif_start_")) {
        const parts = i.customId.split("_");
        const guildId = parts.slice(2).join("_") || i.guildId;
        const settings = verifSettings.get(guildId);

        if (!settings) {
          return await i.reply({ content: "❌ This verification panel is not properly configured.", ephemeral: true });
        }

        // generate code and store
        const code = generateCode(6);
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
        verifCodes.set(i.user.id, { code, expiresAt, guildId });

        // ephemeral message showing code and button to open modal
        const embed = new EmbedBuilder()
          .setTitle("🧩 Verification Code")
          .setDescription(`Your verification code: ||${code}||

Click "Enter Code" to submit the code. The code expires in 5 minutes.`)
          .setColor("#ffd700");

        const openModalButton = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`verif_modal_open_${i.user.id}`).setLabel("Enter Code").setStyle(ButtonStyle.Success)
        );

        return await i.reply({ embeds: [embed], components: [openModalButton], ephemeral: true });
      }

      // open modal for a specific user - ensures only the user who started can open
      if (i.customId && i.customId.startsWith("verif_modal_open_")) {
        const parts = i.customId.split("_");
        const userId = parts.slice(3).join("_");

        if (i.user.id !== userId) {
          return await i.reply({ content: "❌ You cannot open this modal for another user.", ephemeral: true });
        }

        // create modal
        const modal = new ModalBuilder()
          .setCustomId(`verif_modal_${userId}`)
          .setTitle("Enter Verification Code");

        const input = new TextInputBuilder()
          .setCustomId("code_input")
          .setLabel("Type the code shown to you")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(8);

        const row = new ActionRowBuilder().addComponents(input);
        modal.addComponents(row);

        return await i.showModal(modal);
      }
    }

    // Handle modal submit for verification code
    if (i.isModalSubmit()) {
      if (i.customId && i.customId.startsWith("verif_modal_")) {
        const parts = i.customId.split("_");
        const userId = parts.slice(2).join("_");

        if (i.user.id !== userId) {
          return await i.reply({ content: "❌ Unauthorized modal submission.", ephemeral: true });
        }

        const entry = verifCodes.get(i.user.id);
        if (!entry) {
          return await i.reply({ content: "❌ No verification started or code expired.", ephemeral: true });
        }

        if (Date.now() > entry.expiresAt) {
          verifCodes.delete(i.user.id);
          return await i.reply({ content: "❌ Code expired. Please try again.", ephemeral: true });
        }

        const value = i.fields.getTextInputValue("code_input").trim();
        if (value !== entry.code) {
          return await i.reply({ content: "❌ Incorrect code. Please try again.", ephemeral: true });
        }

        // successful verification
        const settings = verifSettings.get(entry.guildId);
        if (!settings) {
          return await i.reply({ content: "❌ Guild verification settings no longer exist.", ephemeral: true });
        }

        try {
          const member = await i.guild.members.fetch(i.user.id);
          await member.roles.add(settings.verifiedRoleId);
          try {
            await member.roles.remove(settings.unverifiedRoleId);
          } catch {
            // remove may fail if user doesn't have role or bot lacks perms - ignore
          }
          verifCodes.delete(i.user.id);

          return await i.reply({ content: "✅ Verification successful! Roles updated.", ephemeral: true });
        } catch (err) {
          console.error("Verification role update error:", err);
          return await i.reply({ content: "❌ Failed to update roles. Check bot permissions.", ephemeral: true });
        }
      }
    }
  } catch (e) {
    console.error(e);
    try {
      if (i.replied || i.deferred) {
        return await i.followUp({ content: "❌ Error occurred.", ephemeral: true });
      }
      return await i.reply({ content: "❌ Error occurred.", ephemeral: true });
    } catch (err) {
      console.error("Failed to notify user about error:", err);
    }
  }
}
