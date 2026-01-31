import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const category = "Moderation";
export const data = new SlashCommandBuilder()
  .setName("warnings")
  .setDescription("Show warnings")
  .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(i, { warnings }) {
  const user = i.options.getUser("user");
  const list = warnings.get(user.id) || [];

  if (list.length === 0) {
    await i.reply(`${user.tag} has no warnings.`);
    return;
  }

  await i.reply(`⚠️ Warnings for **${user.tag}**:\n- ${list.join("\n- ")}`);
}
