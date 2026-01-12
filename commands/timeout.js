import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const category = "Moderation";

export const data = new SlashCommandBuilder()
  .setName("timeout")
  .setDescription("Timeout a member for a specific duration.")
  .addUserOption(option =>
    option.setName("user")
      .setDescription("The user to timeout")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("duration")
      .setDescription("Duration (10m, 1h, 1d)")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("reason")
      .setDescription("Reason for timeout")
      .setRequired(false)
  )
  .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);

export async function execute(interaction) {
  const user = interaction.options.getUser("user");
  const member = await interaction.guild.members.fetch(user.id);
  const duration = interaction.options.getString("duration");
  const reason = interaction.options.getString("reason") || "No reason provided";

  const timeRegex = /^(\d+)(s|m|h|d)$/;
  const match = duration.match(timeRegex);

  if (!match) {
    return interaction.reply({
      content: "Invalid duration format. Use: 10m, 1h, 1d",
      ephemeral: true
    });
  }

  const amount = parseInt(match[1]);
  const unit = match[2];

  let ms = 0;
  switch (unit) {
    case "s": ms = amount * 1000; break;
    case "m": ms = amount * 60 * 1000; break;
    case "h": ms = amount * 60 * 60 * 1000; break;
    case "d": ms = amount * 24 * 60 * 60 * 1000; break;
  }

  try {
    await member.timeout(ms, reason);
    interaction.reply(`⏳ **${user.tag}** has been timed out for **${duration}**.\nReason: ${reason}`);
  } catch (err) {
    console.error(err);
    interaction.reply({
      content: "Failed to timeout the user.",
      ephemeral: true
    });
  }
}
