import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const category = "Utility";
export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Command list");

export async function execute(i) {
  const commands = i.client.commands;
  const categories = {};

  for (const command of commands.values()) {
    if (!categories[command.category]) {
      categories[command.category] = [];
    }
    categories[command.category].push(`\`/${command.data.name}\` — ${command.data.description}`);
  }

  const embed = new EmbedBuilder()
    .setTitle("📖 Bot Commands")
    .setDescription("Here’s a list of available commands grouped by category:")
    .setColor("#00bfff")
    .setFooter({ text: "Use / followed by the command name to activate." });

  for (const categoryName in categories) {
    embed.addFields({
      name: categoryName,
      value: categories[categoryName].join("\n"),
    });
  }

  await i.reply({
    embeds: [embed],
    ephemeral: true,
  });
}
