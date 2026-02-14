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

  // Collector to handle category selection
  const collector = interaction.channel.createMessageComponentCollector({
    componentType: "SELECT_MENU",
    time: 60_000, // 1 minute
  });

  collector.on("collect", async i => {
    if (i.customId === "help-category") {
      const selected = i.values[0];
      const cmdsInCategory = commands
        .filter(cmd => cmd.category === selected)
        .map(cmd => `\`${cmd.data.name}\``)
        .join(", ");

      const newEmbed = new EmbedBuilder()
        .setTitle("📘 Help Menu")
        .setDescription(
          `**Categories:**\n${categoryArray.join(", ")}\n\n` +
          `**Commands in ${selected}:**\n${cmdsInCategory}`
        )
        .setColor(0x00bfff);

      // Always re‑send the menu so it stays visible
      await i.update({
        embeds: [newEmbed],
        components: [row],
      });
    }
  });
}
