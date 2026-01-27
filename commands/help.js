import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from "discord.js";

export const category = "Utility";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show all commands by category");

export async function execute(interaction) {
  const commands = [...interaction.client.commands.values()];
  
  // Get unique categories
  const categories = new Set();
  commands.forEach(cmd => {
    if (cmd.category) {
      categories.add(cmd.category);
    }
  });
  
  const categoryArray = [...categories].sort();
  
  // Create category select menu
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("help-category")
    .setPlaceholder("Select a category")
    .addOptions(categoryArray.map(cat => ({
      label: cat,
      value: cat,
      description: `Commands in ${cat}`,
    })));

  const row = new ActionRowBuilder().addComponents(selectMenu);

  const embed = new EmbedBuilder()
    .setTitle("📘 Help Menu")
    .setDescription("Select a category to view commands:")
    .setColor(0x00bfff);

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true,
  });
}
