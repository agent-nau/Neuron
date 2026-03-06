import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";

export const name = "interactionCreate";

export async function execute(i, { warnings, verifSettings, verifCodes, joinSettings, generateCode, client }) {
  try {
    // 🚀 Slash Command Handling
    if (i.isChatInputCommand()) {
      const command = client.commands.get(i.commandName);
      if (!command) return;

      try {
        await command.execute(i);
      } catch (error) {
        console.error(`Error executing command ${i.commandName}:`, error);
        const errorMessage = { content: '❌ There was an error while executing this command!', flags: MessageFlags.Ephemeral };
        if (i.deferred || i.replied) {
          await i.editReply(errorMessage);
        } else {
          await i.reply(errorMessage);
        }
      }
      return;
    }

    // 📖 Help menu category selection
    if (i.isStringSelectMenu() && i.customId === "help-category") {
      const selectedCategory = i.values[0];
      const commands = [...client.commands.values()].filter(cmd => cmd.category === selectedCategory);

      const embed = new EmbedBuilder()
        .setTitle(`📘 ${selectedCategory} Commands`)
        .setDescription(`Commands in the ${selectedCategory} category:`)
        .setColor(0x00bfff);

      if (commands.length === 0) {
        embed.setDescription("No commands in this category.");
      } else {
        for (const cmd of commands) {
          embed.addFields({
            name: `/${cmd.data.name}`,
            value: cmd.data.description || "No description",
          });
        }
      }

      return await i.update({ embeds: [embed], components: [] });
    }

    // 📖 Help menu pagination buttons handled by helpButton.js

    // 🧩 Verification: start button
    if (i.isButton() && i.customId.startsWith("verif_start_")) {
      const parts = i.customId.split("_");
      const guildId = parts.slice(2).join("_") || i.guildId;
      const settings = verifSettings.get(guildId);
      if (!settings) {
        return await i.reply({ content: "❌ This verification panel is not properly configured.", flags: MessageFlags.Ephemeral });
      }

      const code = generateCode(6);
      const expiresAt = Date.now() + 5 * 60 * 1000;
      verifCodes.set(i.user.id, { code, expiresAt, guildId });

      const embed = new EmbedBuilder()
        .setTitle("🧩 Verification Code")
        .setDescription(`Your verification code: ||${code}||\n\nClick "Enter Code" to submit. Expires in 5 minutes.`)
        .setColor("#ffd700");

      const openModalButton = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`verif_modal_open_${i.user.id}`)
          .setLabel("Enter Code")
          .setStyle(ButtonStyle.Success)
      );

      return await i.reply({ embeds: [embed], components: [openModalButton], flags: MessageFlags.Ephemeral });
    }

    // 🧩 Verification: open modal
    if (i.isButton() && i.customId.startsWith("verif_modal_open_")) {
      const parts = i.customId.split("_");
      const userId = parts.slice(3).join("_");
      if (i.user.id !== userId) {
        return await i.reply({ content: "❌ You cannot open this modal for another user.", flags: MessageFlags.Ephemeral });
      }

      const modal = new ModalBuilder()
        .setCustomId(`verif_modal_${userId}`)
        .setTitle("Enter Verification Code");

      const input = new TextInputBuilder()
        .setCustomId("code_input")
        .setLabel("Type the code shown to you")
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(8);

      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return await i.showModal(modal);
    }

    // 🧩 Verification: modal submit
    if (i.isModalSubmit() && i.customId.startsWith("verif_modal_")) {
      const parts = i.customId.split("_");
      const userId = parts.slice(2).join("_");
      if (i.user.id !== userId) {
        return await i.reply({ content: "❌ Unauthorized modal submission.", flags: MessageFlags.Ephemeral });
      }

      const entry = verifCodes.get(i.user.id);
      if (!entry) {
        return await i.reply({ content: "❌ No verification started or code expired.", flags: MessageFlags.Ephemeral });
      }

      if (Date.now() > entry.expiresAt) {
        verifCodes.delete(i.user.id);
        return await i.reply({ content: "❌ Code expired. Please try again.", flags: MessageFlags.Ephemeral });
      }

      const value = i.fields.getTextInputValue("code_input").trim();
      if (value !== entry.code) {
        return await i.reply({ content: "❌ Incorrect code. Please try again.", flags: MessageFlags.Ephemeral });
      }

      const settings = verifSettings.get(entry.guildId);
      if (!settings) {
        return await i.reply({ content: "❌ Guild verification settings no longer exist.", flags: MessageFlags.Ephemeral });
      }

      try {
        const member = await i.guild.members.fetch(i.user.id);
        await member.roles.add(settings.verifiedRoleId);
        try {
          await member.roles.remove(settings.unverifiedRoleId);
        } catch {}
        verifCodes.delete(i.user.id);
        return await i.reply({ content: "✅ Verification successful! Roles updated.", flags: MessageFlags.Ephemeral });
      } catch (err) {
        console.error("Verification role update error:", err);
        return await i.reply({ content: "❌ Failed to update roles. Check bot permissions.", flags: MessageFlags.Ephemeral });
      }
    }

    // 📩 Handle Command-specific Interactions (Buttons, Modals, Select Menus)
    // This allows commands like panel.js to handle their own events
    if (!i.isChatInputCommand()) {
      for (const command of client.commands.values()) {
        if (typeof command.handleInteraction === 'function') {
          try {
            await command.handleInteraction(i);
          } catch (error) {
            console.error(`Error in handleInteraction for command:`, error);
          }
        }
      }
    }

  } catch (error) {
    console.error("interactionCreate error:", error);
  }
}