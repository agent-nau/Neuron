import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const category = "Role Management";
export const data = new SlashCommandBuilder()
  .setName("addrole")
  .setDescription("Add a role to a user")
  .addUserOption(o => o.setName("user").setDescription("User to assign the role to").setRequired(true))
  .addRoleOption(o => o.setName("role").setDescription("Role to assign").setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles); 

export async function execute(i) {
  const user = i.options.getUser("user");
  const role = i.options.getRole("role");
    const member = await i.guild.members.fetch(user.id);
    try {
        await member.roles.add(role);
        await i.reply(`✅ Added role **${role.name}** to **${user.tag}**`);
    } catch {
        await i.reply({ content: `❌ Unable to add role **${role.name}** to **${user.tag}**`, ephemeral: true });
    }
}