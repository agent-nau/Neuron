import { SlashCommandBuilder, PermissionFlagsBits} from "discord.js";

export const category = "Reaction Roles";

export const data = new SlashCommandBuilder()
  .setName("reactionrole")
  .setDescription("Set up a reaction role message")
  .addChannelOption(o => o.setName("channel").setDescription("Channel to send the reaction role message in").setRequired(true))
  .addStringOption(o => o.setName("message").setDescription("The message content for the reaction role").setRequired(true))
  .addRoleOption(o => o.setName("role").setDescription("Role to assign when reacted").setRequired(true))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);
  
export async function execute(i) {
    const channel = i.options.getChannel("channel");
    const messageContent = i.options.getString("message");
    const role = i.options.getRole("role");
    try {
        const msg = await channel.send({ content: `${messageContent}\nReact with ✅ to get the **${role.name}** role!` });
        await msg.react("✅");
        await i.reply(`✅ Reaction role message sent in ${channel} for role **${role.name}**`);
    } catch {
        await i.reply({ content: "❌ Failed to send reaction role message", ephemeral: true });
    }
}