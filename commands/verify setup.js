import { SlashCommandBuilder, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

export const category = "Verification";
export const data = new SlashCommandBuilder()
  .setName("verify")
  .setDescription("Verification system")
  .addSubcommand(sub => sub.setName("setup").setDescription("Post verification panel")
    .addChannelOption(o => o.setName("channel").setDescription("Panel channel").setRequired(true).addChannelTypes(ChannelType.GuildText))
    .addRoleOption(o => o.setName("verified_role").setDescription("Role to add on success").setRequired(true))
    .addRoleOption(o => o.setName("unverified_role").setDescription("Role to remove on success").setRequired(true))
  );

export async function execute(i, verifSettings) {
  if (i.options.getSubcommand() === "setup") {
    const channel = i.options.getChannel("channel");
    const verifiedRole = i.options.getRole("verified_role");
    const unverifiedRole = i.options.getRole("unverified_role");

    // save settings in memory
    verifSettings.set(i.guild.id, {
      channelId: channel.id,
      verifiedRoleId: verifiedRole.id,
      unverifiedRoleId: unverifiedRole.id,
    });

    const embed = new EmbedBuilder();
    embed.setTitle("🔒 Verification");
    embed.setDescription("Press the button to begin verification. You will get a short code to enter (e.g., L3q9xd).");
    embed.setColor("#00ff66");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`verif_start_${i.guild.id}`).setLabel("Verify").setStyle(ButtonStyle.Primary)
    );

    await channel.send({ embeds: [embed], components: [row] });
    await i.reply({ content: "✅ Verification panel posted.", ephemeral: true });
  }
}
