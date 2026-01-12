import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from "discord.js";

export const category = "Utility";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show all commands in a clickable dropdown menu");

export async function execute(interaction) {
  const commands = interaction.client.commands;

  // Build dropdown menu options dynamically
  const options = [...commands.values()].map(cmd =>
    new StringSelectMenuOptionBuilder()
      .setLabel(`/${cmd.data.name}`)
      .setDescription(cmd.data.description)
      .setValue(cmd.data.name)
  );

  const menu = new StringSelectMenuBuilder()
    .setCustomId("help-menu")
    .setPlaceholder("Select a command to view details")
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(menu);

  const embed = new EmbedBuilder()
    .setTitle("📖 Help Menu")
    .setDescription("Choose a command from the dropdown to learn more.")
    .setColor(0x00bfff);

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
}
