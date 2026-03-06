import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('panel')
  .setDescription('Setup the Support Panel (Tickets, Suggestions, Reports) [Stateless]')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sub =>
    sub.setName('setup')
      .setDescription('Post the support panel')
      .addChannelOption(o => o.setName('channel').setDescription('Channel to post the panel').setRequired(true).addChannelTypes(ChannelType.GuildText))
      .addChannelOption(o => o.setName('suggestion_logs').setDescription('Channel for suggestions').setRequired(true).addChannelTypes(ChannelType.GuildText))
      .addChannelOption(o => o.setName('report_logs').setDescription('Channel for reports').setRequired(true).addChannelTypes(ChannelType.GuildText))
      .addChannelOption(o => o.setName('category').setDescription('Category for tickets (Defaults to current category)').addChannelTypes(ChannelType.GuildCategory))
  );

export async function execute(interaction) {
  const channel = interaction.options.getChannel('channel');
  const suggestionLogs = interaction.options.getChannel('suggestion_logs');
  const reportLogs = interaction.options.getChannel('report_logs');
  
  let category = interaction.options.getChannel('category');
  if (!category) category = channel.parent;

  if (!category) {
    return interaction.reply({ content: '❌ Could not auto-detect a category. Please specify one manually.', ephemeral: true });
  }

  // Encoding: type_suggestionLogId_reportLogId_categoryId
  const baseValue = `${suggestionLogs.id}_${reportLogs.id}_${category.id}`;

  const panelEmbed = new EmbedBuilder()
    .setTitle('📋 Support Panel')
    .setDescription('**How to Use**\n• Use the dropdown below to pick a support form.\n• Once you select your choice within the dropdown, you will be presented with a form to fill out for our Moderators to review.\n• Report forms can only be submitted once every minute. Each appeal form has its own cooldown that only resets after your current appeal has been reviewed and processed.\n\n**Misuse Warning**\n• Before submitting a form, please review the form guidelines.\n• If you do not follow these guidelines, you are subject to having your form denied and/or being blacklisted from submitting forms.\n\nThank you for reading.\nIf the form selection does not work properly, please contact a Moderator.')
    .setColor(0x00AE86);

  const selectRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('panel_select')
      .setPlaceholder('Make a selection...')
      .addOptions([
        { label: 'Create Ticket', value: `tickets_${baseValue}`, description: 'Open a support ticket' },
        { label: 'Submit Suggestion', value: `suggestions_${baseValue}`, description: 'Share your ideas' },
        { label: 'Submit Report', value: `reports_${baseValue}`, description: 'Report an issue or user' },
      ])
  );

  await channel.send({ embeds: [panelEmbed], components: [selectRow] });
  
  await interaction.reply({ 
    content: `✅ Panel posted in ${channel}!\n**Settings (Encoded):**\nSuggestions: <#${suggestionLogs.id}>\nReports: <#${reportLogs.id}>\nTickets: <#${category.id}>`, 
    ephemeral: true 
  });
}

export async function handleInteraction(interaction) {
  // 1. SELECT MENU HANDLING
  if (interaction.isStringSelectMenu() && interaction.customId === 'panel_select') {
    const [type, suggLogId, repLogId, catId] = interaction.values[0].split('_');

    if (type === 'tickets') {
      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: catId,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: ['ViewChannel'] },
          { id: interaction.user.id, allow: ['ViewChannel', 'SendMessages'] }
        ]
      });
      return await interaction.reply({ content: `✅ Ticket created: ${ticketChannel}`, ephemeral: true });
    }

    if (type === 'suggestions') {
      const modal = new ModalBuilder()
        .setCustomId(`suggestions_modal_${suggLogId}`)
        .setTitle('💡 Submit a Suggestion');
      const input = new TextInputBuilder().setCustomId('text').setLabel('Your suggestion').setStyle(TextInputStyle.Paragraph).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return await interaction.showModal(modal);
    }

    if (type === 'reports') {
      const modal = new ModalBuilder()
        .setCustomId(`reports_modal_${repLogId}`)
        .setTitle('🚨 Submit a Report');
      const input = new TextInputBuilder().setCustomId('text').setLabel('Describe the issue').setStyle(TextInputStyle.Paragraph).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return await interaction.showModal(modal);
    }
  }

  // 2. MODAL SUBMISSION
  if (interaction.isModalSubmit()) {
    if (interaction.customId.startsWith('suggestions_modal_')) {
      const logChannelId = interaction.customId.split('_')[2];
      const suggestion = interaction.fields.getTextInputValue('text');
      const logChannel = interaction.guild.channels.cache.get(logChannelId);

      if (!logChannel) return interaction.reply({ content: '❌ Log channel not found! The panel might be outdated.', ephemeral: true });

      const embed = new EmbedBuilder()
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

      await logChannel.send({ embeds: [embed], components: [row] });
      return await interaction.reply({ content: '✅ Suggestion submitted!', ephemeral: true });
    }

    if (interaction.customId.startsWith('reports_modal_')) {
      const logChannelId = interaction.customId.split('_')[2];
      const report = interaction.fields.getTextInputValue('text');
      const logChannel = interaction.guild.channels.cache.get(logChannelId);

      if (!logChannel) return interaction.reply({ content: '❌ Log channel not found! The panel might be outdated.', ephemeral: true });

      const embed = new EmbedBuilder()
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

      await logChannel.send({ embeds: [embed], components: [row] });
      return await interaction.reply({ content: '✅ Report submitted!', ephemeral: true });
    }

    if (interaction.customId.startsWith('dev_comment_modal_')) {
      const [,,, type, action, userId] = interaction.customId.split('_');
      const comment = interaction.fields.getTextInputValue('dev_comment');
      const user = await interaction.client.users.fetch(userId).catch(() => null);

      const status = action === 'approve' || action === 'solve' ? '✅ accepted/solved' : '❌ denied/unsolved';
      const color = action === 'approve' || action === 'solve' ? 0x00FF00 : 0xFF0000;
      
      const responseEmbed = new EmbedBuilder()
        .setTitle(`Update on your ${type}`)
        .setDescription(`Your ${type} has been **${status}**.`)
        .addFields({ name: 'Developer Comment', value: comment })
        .setColor(color)
        .setTimestamp();

      if (user) await user.send({ embeds: [responseEmbed] }).catch(() => {});

      const oldEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
      oldEmbed.addFields({ name: `Dev Decision: ${action.toUpperCase()}`, value: comment });
      oldEmbed.setColor(color);

      return await interaction.update({ embeds: [oldEmbed], components: [] });
    }
  }

  // 3. BUTTONS
  if (interaction.isButton()) {
    const parts = interaction.customId.split('_');
    if (parts.length < 3) return;

    const [action, type, userId] = parts;
    if (['approve', 'deny', 'solve', 'unsolved'].includes(action)) {
      const modal = new ModalBuilder()
        .setCustomId(`dev_comment_modal_${type}_${action}_${userId}`)
        .setTitle('Add Developer Comment');

      const input = new TextInputBuilder().setCustomId('dev_comment').setLabel('Your comment to the user').setStyle(TextInputStyle.Paragraph).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return await interaction.showModal(modal);
    }
  }
}
