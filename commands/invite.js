import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

export const category = "Utility";

export const data = new SlashCommandBuilder()
  .setName("invite")
  .setDescription("Get the bot's invite link");

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setTitle("Invite Link")
    .setDescription("Click the button below to invite the bot to your server!")
    .setColor(0xffd700)
    .setFooter({
      text: `${interaction.client.user.username} | powered by vecs corporation`,
      iconURL: interaction.client.user.displayAvatarURL()
    });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel("Invite Bot")
      .setStyle(ButtonStyle.Link)
      .setURL(`https://discord.com/api/oauth2/authorize?client_id=${interaction.client.user.id}&permissions=8&scope=bot%20applications.commands`),
    new ButtonBuilder()
      .setLabel("Support Server")
      .setStyle(ButtonStyle.Link)
      .setURL(process.env.SUPPORT_LINK)
  );

  await interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
}
