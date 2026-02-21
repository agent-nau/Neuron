import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from "discord.js";

export const category = "Utility";

export const data = new SlashCommandBuilder()
  .setName("say")
  .setDescription("Say something as bot")
  .addStringOption(o => o.setName("message").setDescription("Message").setRequired(true))
  .addChannelOption(o => o.setName("channel").setDescription("Target channel").addChannelTypes(ChannelType.GuildText))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(i) {
  const msg = i.options.getString("message");
  const target = i.options.getChannel("channel") || i.channel;

  try {
    await target.send({ content: msg });
    await i.reply({ content: "✅ Sent!", ephemeral: true });
  } catch {
    await i.reply({ content: "❌ Failed to send message", ephemeral: true });
  }
}
