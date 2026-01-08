import { SlashCommandBuilder, ChannelType } from "discord.js";

export const category = "Tickets";
export const data = new SlashCommandBuilder()
  .setName("ticket")
  .setDescription("Ticket system")
  .addSubcommand(sub => sub.setName("setup").setDescription("Post ticket panel")
    .addChannelOption(o => o.setName("channel").setDescription("Panel channel").setRequired(true).addChannelTypes(ChannelType.GuildText))
    .addChannelOption(o => o.setName("category").setDescription("Ticket category").setRequired(true).addChannelTypes(ChannelType.GuildCategory))
  );

export async function execute(i) {
  if (i.options.getSubcommand() === "setup") {
    await i.reply({
      content: "🎫 Ticket panel setup coming soon!",
      ephemeral: true
    });
  }
}
