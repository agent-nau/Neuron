import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const category = "Moderation";
export const data = new SlashCommandBuilder()
  .setName("warn")
  .setDescription("Warn a member")
  .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
  .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(i, warnings) {
  const user = i.options.getUser("user");
  const reason = i.options.getString("reason");

  if (!warnings.has(user.id)) warnings.set(user.id, []);
  warnings.get(user.id).push(reason);

  await i.reply(`⚠️ Warned **${user.tag}**: ${reason}`);
}
