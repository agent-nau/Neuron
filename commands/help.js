import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

export const category = "Utility";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show all commands with pagination");

export async function execute(interaction) {
  const commands = [...interaction.client.commands.values()];
  const pageSize = 5;
  const page = 0;

  const totalPages = Math.ceil(commands.length / pageSize);
  const pageCommands = commands.slice(page * pageSize, (page + 1) * pageSize);

  const embed = new EmbedBuilder()
    .setTitle("📘 Help Menu")
    .setDescription("Below is a list of available commands:")
    .setColor(0x00bfff);

  for (const cmd of pageCommands) {
    embed.addFields({
      name: `/${cmd.data.name}`,
      value: cmd.data.description || "No description",
    });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`help_prev_${interaction.user.id}_${page}`)
      .setLabel("◀ Previous")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`help_next_${interaction.user.id}_${page}`)
      .setLabel("Next ▶")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(totalPages <= 1)
  );

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
}
