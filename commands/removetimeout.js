import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const category = "Moderation";

export const data = new SlashCommandBuilder()
  .setName("removetimeout")
  .setDescription("Remove timeout from a member.")
  .addUserOption(option =>
    option.setName("user")
      .setDescription("The user to remove timeout from")
      .setRequired(true)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction) {
  const user = interaction.options.getUser("user");
  const member = await interaction.guild.members.fetch(user.id);

  try {
    await member.timeout(null);
    interaction.reply(`🔓 Timeout removed from **${user.tag}**.`);
  } catch (err) {
    console.error(err);
    interaction.reply({
      content: "Failed to remove timeout.",
      ephemeral: true
    });
  }
}
