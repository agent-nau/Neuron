import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const category = "Moderation";
export const data = new SlashCommandBuilder()
  .setName("timeout")
  .setDescription("Timeout a member")
  .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
  .addIntegerOption(o => o.setName("duration").setDescription("Minutes").setRequired(true).setMinValue(1).setMaxValue(10080))
  .addStringOption(o => o.setName("reason").setDescription("Reason"))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(i) {
  const user = i.options.getUser("user");
  const duration = i.options.getInteger("duration");
  const reason = i.options.getString("reason") || "No reason provided";

  try {
    const m = await i.guild.members.fetch(user.id);
    await m.timeout(duration * 60000, reason);
    await i.reply(`⏳ Timed out **${user.tag}** for ${duration} minutes. **Reason: ${reason}**`);
  } catch {
    await i.reply({ content: `❌ Failed to timeout ${user.tag}`, ephemeral: true });
  }
}
