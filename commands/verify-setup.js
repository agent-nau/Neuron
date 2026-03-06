import { SlashCommandBuilder, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits, MessageFlags } from "discord.js";

export const category = "Verification";

export const data = new SlashCommandBuilder()
  .setName("verify")
  .setDescription("Verification system [Stateless]")
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sub => sub.setName("setup").setDescription("Post verification panel")
    .addChannelOption(o => o.setName("channel").setDescription("Panel channel").setRequired(true).addChannelTypes(ChannelType.GuildText))
    .addRoleOption(o => o.setName("verified_role").setDescription("Role to add on success").setRequired(true))
    .addRoleOption(o => o.setName("unverified_role").setDescription("Role to remove on success").setRequired(true))
  );

export async function execute(interaction) {
  if (interaction.options.getSubcommand() === "setup") {
    const channel = interaction.options.getChannel("channel");
    const verifiedRole = interaction.options.getRole("verified_role");
    const unverifiedRole = interaction.options.getRole("unverified_role");

    const embed = new EmbedBuilder()
      .setTitle("🔒 Verification")
      .setDescription("Press the button to begin verification. You will get a short code to enter (e.g., L3q9xd).")
      .setColor("#00ff66");

    // Encoding roles into customId: verif_start_verifiedId_unverifiedId
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`verif_start_${verifiedRole.id}_${unverifiedRole.id}`)
        .setLabel("Verify")
        .setStyle(ButtonStyle.Primary)
    );

    await channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: "✅ Verification panel posted. This panel is stateless and will work even after bot restarts!", flags: MessageFlags.Ephemeral });
  }
}

// Global handleInteraction logic
export async function handleInteraction(interaction, { generateCode, verifCodes }) {
  if (interaction.isButton() && interaction.customId.startsWith("verif_start_")) {
    const [,, vRoleId, uRoleId] = interaction.customId.split("_");
    
    const code = generateCode(6);
    const expiresAt = Date.now() + 5 * 60 * 1000;
    
    // verifCodes is still in memory (state.js), which is fine for short-lived codes
    verifCodes.set(interaction.user.id, { code, expiresAt, vRoleId, uRoleId });

    const embed = new EmbedBuilder()
      .setTitle("🧩 Verification Code")
      .setDescription(`Your verification code: ||${code}||\n\nClick "Enter Code" to submit. Expires in 5 minutes.`)
      .setColor("#ffd700");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`verif_modal_open_${interaction.user.id}`)
        .setLabel("Enter Code")
        .setStyle(ButtonStyle.Success)
    );

    return await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
  }

  if (interaction.isButton() && interaction.customId.startsWith("verif_modal_open_")) {
    const userId = interaction.customId.split("_")[3];
    if (interaction.user.id !== userId) return await interaction.reply({ content: "❌ Not your session.", flags: MessageFlags.Ephemeral });

    const modal = new ModalBuilder().setCustomId(`verif_modal_${userId}`).setTitle("Enter Verification Code");
    const input = new TextInputBuilder().setCustomId("code_input").setLabel("Code").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(8);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return await interaction.showModal(modal);
  }

  if (interaction.isModalSubmit() && interaction.customId.startsWith("verif_modal_")) {
    const userId = interaction.customId.split("_")[2];
    if (interaction.user.id !== userId) return await interaction.reply({ content: "❌ Not your session.", flags: MessageFlags.Ephemeral });

    const entry = verifCodes.get(interaction.user.id);
    if (!entry || Date.now() > entry.expiresAt) {
      verifCodes.delete(interaction.user.id);
      return await interaction.reply({ content: "❌ Code expired or session not found.", flags: MessageFlags.Ephemeral });
    }

    const value = interaction.fields.getTextInputValue("code_input").trim();
    if (value !== entry.code) return await interaction.reply({ content: "❌ Incorrect code.", flags: MessageFlags.Ephemeral });

    try {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      await member.roles.add(entry.vRoleId);
      if (entry.uRoleId && entry.uRoleId !== 'none') {
        try { await member.roles.remove(entry.uRoleId); } catch {}
      }
      verifCodes.delete(interaction.user.id);
      return await interaction.reply({ content: "✅ Verification successful!", flags: MessageFlags.Ephemeral });
    } catch (err) {
      console.error(err);
      return await interaction.reply({ content: "❌ Failed to update roles.", flags: MessageFlags.Ephemeral });
    }
  }
}
