import {
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";

export const category = "Utility";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show all commands by category");

export async function execute(interaction) {
  const commands = [...interaction.client.commands.values()];

  // Group commands by category
  const categories = {};
  commands.forEach(cmd => {
    const cat = cmd.category || "Uncategorized";
    if (!categories[cat]) categories[cat] = [];
    categories[cat].push(cmd);
  });

  // Build embed description
  let description = "";
  for (const [cat, cmds] of Object.entries(categories)) {
    description += `**📂 ${cat}**\n`;
    description += cmds
      .map(c => `\`${c.data.name}\` — ${c.data.description}`)
      .join("\n");
    description += "\n\n";
  }

  const embed = new EmbedBuilder()
    .setTitle("📘 Help Menu")
    .setDescription(description.trim())
    .setColor(0x00bfff);

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });
}