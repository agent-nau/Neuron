import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const category = "Moderation";
export const data = new SlashCommandBuilder()
  .setName("kick")
  .setDescription("Kick a member")
  .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
  .addStringOption(o => o.setName("reason").setDescription("Reason"))
  .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers);

export async function execute(i) {
  const user = i.options.getUser("user");
  const reason = i.options.getString("reason") || "No reason provided";

  try {
    const member = await i.guild.members.fetch(user.id);
    await member.kick(reason);
    await i.reply(`✅ Kicked **${user.tag}**`);
  } catch {
    await i.reply({ content: `❌ Unable to kick ${user.tag}`, ephemeral: true });
  }
}
