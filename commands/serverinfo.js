import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const category = "Utility";

export const data = new SlashCommandBuilder()
  .setName("serverinfo")
  .setDescription("Server info");

export async function execute(i) {
  await i.reply({
    embeds: [
      new EmbedBuilder()
        .setTitle("📊 Server Info")
        .addFields(
          { name: "Name", value: i.guild.name, inline: true },
          { name: "Members", value: `${i.guild.memberCount}`, inline: true },
          { name: "Owner ID", value: i.guild.ownerId, inline: true }
        )
        .setColor("#00bfff")
    ]
  });
}
