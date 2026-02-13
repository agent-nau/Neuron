import {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";

export const name = "interactionCreate";

export async function execute(i, { warnings, verifSettings, verifCodes, joinSettings, generateCode, client }) {
  try {
    // Slash commands

    if (i.isChatInputCommand()) {
      const command = client.commands.get(i.commandName);
      if (!command) return;
      await command.execute(i, { warnings, verifSettings, verifCodes, joinSettings });
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

    // 📖 Help menu pagination buttons
    if (i.isButton() && i.customId.startsWith("help_")) {
      const parts = i.customId.split("_");
      const direction = parts[1];   // "next" or "prev"
      const userId = parts[2];      // user ID
      const rawPage = parts[3];     // current page number

      if (i.user.id !== userId) {
        return await i.reply({ content: "❌ You can't control someone else's help menu.", ephemeral: true });
      }

      const page = parseInt(rawPage);
      const commands = [...client.commands.values()];
      const pageSize = 5;
      const totalPages = Math.ceil(commands.length / pageSize);

      const newPage = direction === "next" ? page + 1 : page - 1;
      const pageCommands = commands.slice(newPage * pageSize, (newPage + 1) * pageSize);

      const embed = new EmbedBuilder()
        .setTitle("📘 Help Menu")
        .setDescription(`Page ${newPage + 1} of ${totalPages}`)
        .setColor(0x00bfff);

      for (const cmd of pageCommands) {
        embed.addFields({
          name: `/${cmd.data.name}`,
          value: cmd.data.description || "No description",
        });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`help_prev_${userId}_${newPage}`)
          .setLabel("◀ Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(newPage === 0),
        new ButtonBuilder()
          .setCustomId(`help_next_${userId}_${newPage}`)
          .setLabel("Next ▶")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(newPage >= totalPages - 1)
      );

      return await i.update({ embeds: [embed], components: [row] });
    }

    // 🧩 Verification: start button
    if (i.isButton() && i.customId.startsWith("verif_start_")) {
      const parts = i.customId.split("_");
      const guildId = parts.slice(2).join("_") || i.guildId;
      const settings = verifSettings.get(guildId);
      if (!settings) {
        return await i.reply({ content: "❌ This verification panel is not properly configured.", ephemeral: true });
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

      return await i.reply({ embeds: [embed], components: [openModalButton], ephemeral: true });
    }

    // 🧩 Verification: open modal
    if (i.isButton() && i.customId.startsWith("verif_modal_open_")) {
      const parts = i.customId.split("_");
      const userId = parts.slice(3).join("_");
      if (i.user.id !== userId) {
        return await i.reply({ content: "❌ You cannot open this modal for another user.", ephemeral: true });
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

      const settings = verifSettings.get(entry.guildId);
      if (!settings) {
        return await i.reply({ content: "❌ Guild verification settings no longer exist.", ephemeral: true });
      }

      try {
        const member = await i.guild.members.fetch(i.user.id);
        await member.roles.add(settings.verifiedRoleId);
        try {
          await member.roles.remove(settings.unverifiedRoleId);
        } catch {}
        verifCodes.delete(i.user.id);
        return await i.reply({ content: "✅ Verification successful! Roles updated.", ephemeral: true });
      } catch (err) {
        console.error("Verification role update error:", err);
        return await i.reply({ content: "❌ Failed to update roles. Check bot permissions.", ephemeral: true });
      }
    }

  } catch (error) {
    console.error("interactionCreate error:", error);
  }
}