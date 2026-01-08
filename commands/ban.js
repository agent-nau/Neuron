import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const category = "Moderation";
export const data = new SlashCommandBuilder()
  .setName("ban")
  .setDescription("Ban a member")
  .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
  .addStringOption(o => o.setName("reason").setDescription("Reason"))
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers);

export async function execute(i) {
  const user = i.options.getUser("user");
  const reason = i.options.getString("reason") || "No reason provided";

  try {
    await i.guild.members.ban(user.id, { reason });
    await i.reply(`✅ Banned **${user.tag}**`);
  } catch {
    await i.reply({ content: `❌ Unable to ban ${user.tag}`, ephemeral: true });
  }
}
