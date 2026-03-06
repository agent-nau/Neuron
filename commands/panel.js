import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';
import { QuickDB } from 'quick.db';

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName('panel')
  .setDescription('Ticket/Ratings/Suggestions/Reports panel system')
  .addSubcommand(sub =>
    sub.setName('setup')
      .setDescription('Post panel and configure log channels')
      .addChannelOption(o => o.setName('channel').setDescription('Channel to post the panel').setRequired(true))
      .addChannelOption(o => o.setName('category').setDescription('Category where tickets will be created').setRequired(true))
      .addChannelOption(o => o.setName('rating_logs').setDescription('Channel for rating logs').setRequired(true))
      .addChannelOption(o => o.setName('suggestion_logs').setDescription('Channel for suggestion logs').setRequired(true))
      .addChannelOption(o => o.setName('report_logs').setDescription('Channel for report logs').setRequired(true))
  );

export async function execute(interaction) {
  const channel = interaction.options.getChannel('channel');
  const category = interaction.options.getChannel('category');
  const ratingLogs = interaction.options.getChannel('rating_logs');
  const suggestionLogs = interaction.options.getChannel('suggestion_logs');
  const reportLogs = interaction.options.getChannel('report_logs');

  await db.set(`guild_${interaction.guild.id}_config`, {
    rating_logs: ratingLogs.id,
    suggestion_logs: suggestionLogs.id,
    report_logs: reportLogs.id
  });

  const panelEmbed = new EmbedBuilder()
    .setTitle('📋 Support Panel')
    .setDescription('**How to Use**\n• Use the dropdown below to pick a support form.\n• Once you select your choice within the dropdown, you will be presented with a form to fill out for our Moderators to review.\n• Report forms can only be submitted once every minute. Each appeal form has its own cooldown that only resets after your current appeal has been reviewed and processed.\n\n**Misuse Warning**\n• Before submitting a form, please review the form guidelines.\n• If you do not follow these guidelines, you are subject to having your form denied and/or being blacklisted from submitting forms.\n\nThank you for reading.\nIf the form selection does not work properly, please contact a Moderator.')
    .setColor(0x00AE86);

  const selectRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('panel_select')
      .setPlaceholder('Make a selection...')
      .addOptions([
        { label: 'Tickets', value: `tickets_${category.id}`, description: 'Create a support ticket' },
        { label: 'Ratings', value: 'ratings', description: 'Submit a rating & feedback' },
        { label: 'Suggestions', value: 'suggestions', description: 'Submit a suggestion' },
        { label: 'Reports', value: 'reports', description: 'Report an issue' },
      ])
  );

  await channel.send({ embeds: [panelEmbed], components: [selectRow] });
  await interaction.reply({ content: `✅ Panel posted in ${channel}`, ephemeral: true });
}

// Handle interactions
export async function handleInteraction(interaction) {
  if (interaction.isStringSelectMenu() && interaction.customId === 'panel_select') {
    const choice = interaction.values[0];

    // Tickets
    if (choice.startsWith('tickets_')) {
      const categoryId = choice.split('_')[1];
      const guild = interaction.guild;

      const ticketChannel = await guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: 0, // text channel
        parent: categoryId,
        permissionOverwrites: [
          { id: guild.id, deny: ['ViewChannel'] },
          { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] }
        ]
      });

      await interaction.reply({ content: `✅ Ticket created: ${ticketChannel}`, ephemeral: true });
    }

    // Ratings modal
    if (choice === 'ratings') {
      const modal = new ModalBuilder()
        .setCustomId('ratings_modal')
        .setTitle('🌟 Submit Your Rating');

      const ratingInput = new TextInputBuilder()
        .setCustomId('rating_value')
        .setLabel('Rating (1–5)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const commentInput = new TextInputBuilder()
        .setCustomId('rating_comment')
        .setLabel('Comments')
        .setStyle(TextInputStyle.Paragraph);

      const anonInput = new TextInputBuilder()
        .setCustomId('rating_anon')
        .setLabel('Anonymous? (Yes/No)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(ratingInput),
        new ActionRowBuilder().addComponents(commentInput),
        new ActionRowBuilder().addComponents(anonInput)
      );

      await interaction.showModal(modal);
    }

    // Suggestions modal
    if (choice === 'suggestions') {
      const modal = new ModalBuilder()
        .setCustomId('suggestions_modal')
        .setTitle('💡 Submit a Suggestion');

      const suggestionInput = new TextInputBuilder()
        .setCustomId('suggestion_text')
        .setLabel('Your suggestion')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(suggestionInput));
      await interaction.showModal(modal);
    }

    // Reports modal
    if (choice === 'reports') {
      const modal = new ModalBuilder()
        .setCustomId('reports_modal')
        .setTitle('🚨 Submit a Report');

      const reportInput = new TextInputBuilder()
        .setCustomId('report_text')
        .setLabel('Describe the issue')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(reportInput));
      await interaction.showModal(modal);
    }
  }

  // Handle modal submissions
  if (interaction.isModalSubmit()) {
    const config = await db.get(`guild_${interaction.guild.id}_config`);

    if (interaction.customId === 'ratings_modal') {
      const rating = interaction.fields.getTextInputValue('rating_value');
      const comment = interaction.fields.getTextInputValue('rating_comment') || 'No comment';
      const anon = interaction.fields.getTextInputValue('rating_anon').toLowerCase() === 'yes';

      const logEmbed = new EmbedBuilder()
        .setTitle('🌟 New Rating')
        .addFields(
          { name: 'User', value: anon ? 'Anonymous' : `<@${interaction.user.id}>` },
          { name: 'Rating', value: `${rating}/5` },
          { name: 'Comment', value: comment }
        )
        .setColor(0x00FF00)
        .setTimestamp();

      const logChannel = interaction.guild.channels.cache.get(config?.rating_logs);
      if (logChannel) await logChannel.send({ embeds: [logEmbed] });

      await interaction.reply({ content: '✅ Rating submitted!', ephemeral: true });
    }

    if (interaction.customId === 'suggestions_modal') {
      const suggestion = interaction.fields.getTextInputValue('suggestion_text');

      const logEmbed = new EmbedBuilder()
        .setTitle('💡 New Suggestion')
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
        .setDescription(suggestion)
        .setColor(0xFFFF00)
        .setFooter({ text: `User ID: ${interaction.user.id}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`approve_suggestion_${interaction.user.id}`).setLabel('Approve').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`deny_suggestion_${interaction.user.id}`).setLabel('Deny').setStyle(ButtonStyle.Danger)
      );

      const logChannel = interaction.guild.channels.cache.get(config?.suggestion_logs);
      if (logChannel) await logChannel.send({ embeds: [logEmbed], components: [row] });

      await interaction.reply({ content: '💡 Suggestion submitted!', ephemeral: true });
    }

    if (interaction.customId === 'reports_modal') {
      const report = interaction.fields.getTextInputValue('report_text');

      const logEmbed = new EmbedBuilder()
        .setTitle('🚨 New Report')
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
        .setDescription(report)
        .setColor(0xFF0000)
        .setFooter({ text: `User ID: ${interaction.user.id}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`solve_report_${interaction.user.id}`).setLabel('Mark Solved').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`unsolved_report_${interaction.user.id}`).setLabel('Mark Unsolved').setStyle(ButtonStyle.Danger)
      );

      const logChannel = interaction.guild.channels.cache.get(config?.report_logs);
      if (logChannel) await logChannel.send({ embeds: [logEmbed], components: [row] });

      await interaction.reply({ content: '🚨 Report submitted!', ephemeral: true });
    }

    // Dev response modals
    if (interaction.customId.startsWith('dev_comment_modal_')) {
      const [,,, type, action, userId] = interaction.customId.split('_');
      const comment = interaction.fields.getTextInputValue('dev_comment');
      const user = await interaction.client.users.fetch(userId).catch(() => null);

      const status = action === 'approve' || action === 'solve' ? '✅ accepted/solved' : '❌ denied/unsolved';
      
      const responseEmbed = new EmbedBuilder()
        .setTitle(`Update on your ${type}`)
        .setDescription(`Your ${type} has been **${status}**.`)
        .addFields({ name: 'Developer Comment', value: comment })
        .setColor(action === 'approve' || action === 'solve' ? 0x00FF00 : 0xFF0000)
        .setTimestamp();

      if (user) {
        await user.send({ embeds: [responseEmbed] }).catch(() => {
          interaction.channel.send(`⚠️ Could not DM <@${userId}>.`);
        });
      }

      // Update the log message
      const oldEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
      oldEmbed.addFields({ name: `Dev Decision: ${action.toUpperCase()}`, value: comment });
      oldEmbed.setColor(action === 'approve' || action === 'solve' ? 0x00FF00 : 0xFF0000);

      await interaction.update({ embeds: [oldEmbed], components: [] });
    }
  }

  // Handle Button Interactions (Dev review)
  if (interaction.isButton()) {
    const [action, type, userId] = interaction.customId.split('_');
    
    if (['approve', 'deny', 'solve', 'unsolved'].includes(action)) {
      const modal = new ModalBuilder()
        .setCustomId(`dev_comment_modal_${type}_${action}_${userId}`)
        .setTitle('Add Developer Comment');

      const commentInput = new TextInputBuilder()
        .setCustomId('dev_comment')
        .setLabel('Your comment to the user')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(commentInput));
      await interaction.showModal(modal);
    }
  }
}
