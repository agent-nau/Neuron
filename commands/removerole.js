import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js"; 

export const category = "Role Management";
export const data = new SlashCommandBuilder()
    .setName("removerole")
    .setDescription("Remove a role from a user")
    .addUserOption(o => o.setName("user").setDescription("User to remove the role from").setRequired(true))
    .addRoleOption(o => o.setName("role").setDescription("Role to remove").setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);
export async function execute(i) {
    const user = i.options.getUser("user");
    const role = i.options.getRole("role");
    const member = await i.guild.members.fetch(user.id);
    try {
        await member.roles.remove(role);
        await i.reply(`✅ Removed role **${role.name}** from **${user.tag}**`);
    } catch {
        await i.reply({ content: `❌ Unable to remove role **${role.name}** from **${user.tag}**`, ephemeral: true });
    }
}