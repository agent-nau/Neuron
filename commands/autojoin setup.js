import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const category = "Auto-Assign";
export const data = new SlashCommandBuilder()
  .setName("autojoin")
  .setDescription("Auto-assign a role when users join")
  .addSubcommand(sub => sub.setName("setup").setDescription("Enable auto-assign and choose role")
    .addRoleOption(o => o.setName("role").setDescription("Role to assign on join").setRequired(true)))
  .addSubcommand(sub => sub.setName("off").setDescription("Disable auto-assign"))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

export async function execute(i, joinSettings) {
  if (i.options.getSubcommand() === "setup") {
    const role = i.options.getRole("role");
    joinSettings.set(i.guild.id, { roleId: role.id, enabled: true });
    await i.reply({ content: `✅ Auto-assign enabled. Users who join will receive the **${role.name}** role.`, ephemeral: true });
  } else { // off
    joinSettings.delete(i.guild.id);
    await i.reply({ content: "✅ Auto-assign disabled for this server.", ephemeral: true });
  }
}
