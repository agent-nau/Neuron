import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const category = "Moderation";

export const data = new SlashCommandBuilder()
  .setName("clear")
  .setDescription("Bulk delete messages")
  .addIntegerOption(o => o.setName("amount").setDescription("1–100").setRequired(true).setMinValue(1).setMaxValue(100))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(i) {
  const amount = i.options.getInteger("amount");
  try {
    await i.channel.bulkDelete(amount, true);
    await i.reply({ content: `🧹 Deleted ${amount} messages`, ephemeral: true });
  } catch {
    await i.reply({ content: "❌ Cannot delete messages", ephemeral: true });
  }
}
