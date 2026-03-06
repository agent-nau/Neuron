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
  ChannelType,
  ThreadAutoArchiveDuration,
  MessageFlags
} from 'discord.js';

export const data = new SlashCommandBuilder()
  .setName('panel')
  .setDescription('Setup the Support Panel (Stateless)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(sub =>
    sub.setName('setup')
      .setDescription('Post the support panel')
      .addChannelOption(o => o.setName('channel').setDescription('Channel to post the panel').setRequired(true).addChannelTypes(ChannelType.GuildText))
      .addChannelOption(o => o.setName('suggestion_public').setDescription('Public channel for suggestions & threads').setRequired(true).addChannelTypes(ChannelType.GuildText))
      .addChannelOption(o => o.setName('suggestion_dev').setDescription('Private channel for staff to review suggestions').setRequired(true).addChannelTypes(ChannelType.GuildText))
      .addChannelOption(o => o.setName('report_logs').setDescription('Channel for reports').setRequired(true).addChannelTypes(ChannelType.GuildText))
      .addChannelOption(o => o.setName('category').setDescription('Category for tickets (Defaults to current category)').addChannelTypes(ChannelType.GuildCategory))
  );

export async function execute(interaction) {
  const channel = interaction.options.getChannel('channel');
  const suggPublic = interaction.options.getChannel('suggestion_public');
  const suggDev = interaction.options.getChannel('suggestion_dev');
  const reportLogs = interaction.options.getChannel('report_logs');
  
  let category = interaction.options.getChannel('category');
  if (!category) category = channel.parent;

  if (!category) {
    return interaction.reply({ content: '❌ Could not auto-detect a category. Please specify one manually.', flags: MessageFlags.Ephemeral });
  }

  // Encoding: suggPublic_suggDev_repLog_catId
  const configStr = `${suggPublic.id}_${suggDev.id}_${reportLogs.id}_${category.id}`;

  const panelEmbed = new EmbedBuilder()
    .setTitle('📋 Support Panel')
    .setDescription('**How to Use**\n• Use the dropdown below to pick a support form.\n• Once you select your choice within the dropdown, you will be presented with a form to fill out for our Moderators to review.\n• Report forms can only be submitted once every minute. Each appeal form has its own cooldown that only resets after your current appeal has been reviewed and processed.\n\n**Misuse Warning**\n• Before submitting a form, please review the form guidelines.\n• If you do not follow these guidelines, you are subject to having your form denied and/or being blacklisted from submitting forms.\n\nThank you for reading.\nIf the form selection does not work properly, please contact a Moderator.')
    .setColor(0x00AE86);

  const selectRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('panel_select')
      .setPlaceholder('Make a selection...')
      .addOptions([
        { label: 'Create Ticket', value: `tickets_${configStr}`, description: 'Open a support ticket' },
        { label: 'Submit Suggestion', value: `suggestions_${configStr}`, description: 'Share your ideas' },
        { label: 'Submit Report', value: `reports_${configStr}`, description: 'Report an issue or user' },
      ])
  );

  await channel.send({ embeds: [panelEmbed], components: [selectRow] });
  
  await interaction.reply({ 
    content: `✅ Panel posted in ${channel}!\n**Stateless Config:**\nPublic Suggs: ${suggPublic}\nDev Suggs: ${suggDev}\nReports: ${reportLogs}\nTickets: ${category}`, 
    flags: MessageFlags.Ephemeral 
  });
}

export async function handleInteraction(interaction) {
  // 1. SELECT MENU
  if (interaction.isStringSelectMenu() && interaction.customId === 'panel_select') {
    const value = interaction.values[0];
    const parts = value.split('_');
    const type = parts[0];
    const suggPubId = parts[1];
    const suggDevId = parts[2];
    const repLogId = parts[3];
    const catId = parts[4];

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
      return await interaction.reply({ content: `✅ Ticket created: ${ticketChannel}`, flags: MessageFlags.Ephemeral });
    }

    if (type === 'suggestions') {
      const modal = new ModalBuilder()
        .setCustomId(`suggestions_modal_${suggPubId}_${suggDevId}`)
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
    // --- Suggestion Modal ---
    if (interaction.customId.startsWith('suggestions_modal_')) {
      const parts = interaction.customId.split('_');
      const pubChanId = parts[2];
      const devChanId = parts[3];
      const text = interaction.fields.getTextInputValue('text');
      
      const pubChan = interaction.guild.channels.cache.get(pubChanId);
      const devChan = interaction.guild.channels.cache.get(devChanId);

      if (!pubChan || !devChan) return interaction.reply({ content: '❌ Configuration error (Log channels missing).', flags: MessageFlags.Ephemeral });

      // Create Public Log Message
      const pubEmbed = new EmbedBuilder()
        .setTitle('💡 New Suggestion')
        .setDescription(text)
        .addFields({ name: 'Status', value: '⏳ Pending Review' })
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
        .setColor(0xFFFF00)
        .setTimestamp();

      const pubMsg = await pubChan.send({ content: `<@${interaction.user.id}>`, embeds: [pubEmbed] });
      
      // Create discussion thread
      const thread = await pubMsg.startThread({
        name: `Discussion: ${interaction.user.username}'s suggestion`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
      });

      // Create Private Dev Message
      const devEmbed = new EmbedBuilder()
        .setTitle('🛠️ Suggestion for Review')
        .setDescription(text)
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
        .setFooter({ text: `User ID: ${interaction.user.id}` })
        .setColor(0x00BFFF)
        .setTimestamp();

      // IDs: ACTION_USERID_PUBCHANID_PUBMSGID
      const devRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`approve_sugg_${interaction.user.id}_${pubChanId}_${pubMsg.id}`).setLabel('Approve').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`deny_sugg_${interaction.user.id}_${pubChanId}_${pubMsg.id}`).setLabel('Deny').setStyle(ButtonStyle.Danger)
      );

      await devChan.send({ embeds: [devEmbed], components: [devRow] });
      return await interaction.reply({ content: '✅ Suggestion submitted to public and developers!', flags: MessageFlags.Ephemeral });
    }

    // --- Report Modal ---
    if (interaction.customId.startsWith('reports_modal_')) {
      const logChannelId = interaction.customId.split('_')[2];
      const report = interaction.fields.getTextInputValue('text');
      const logChannel = interaction.guild.channels.cache.get(logChannelId);

      if (!logChannel) return interaction.reply({ content: '❌ Log channel not found!', flags: MessageFlags.Ephemeral });

      const embed = new EmbedBuilder()
        .setTitle('🚨 New Report')
        .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL() })
        .setDescription(report)
        .setColor(0xFF0000)
        .setFooter({ text: `User ID: ${interaction.user.id}` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`approve_report_${interaction.user.id}`).setLabel('Approve Report').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`deny_report_${interaction.user.id}`).setLabel('Deny Report').setStyle(ButtonStyle.Danger)
      );

      await logChannel.send({ embeds: [embed], components: [row] });
      return await interaction.reply({ content: '✅ Report submitted!', flags: MessageFlags.Ephemeral });
    }

    // --- Developer Response Modal (Suggestions & Reports) ---
    if (interaction.customId.startsWith('dev_comment_modal_')) {
      const parts = interaction.customId.split('_');
      const type = parts[4]; // 'sugg' or 'report'
      const action = parts[5]; // 'approve', 'deny'
      const userId = parts[6];
      const pubChanId = parts[7];
      const pubMsgId = parts[8];

      const comment = interaction.fields.getTextInputValue('dev_comment');
      const statusLabel = (action === 'approve' || action === 'solve') ? '✅ Accepted' : '❌ Denied';
      const color = (action === 'approve' || action === 'solve') ? 0x00FF00 : 0xFF0000;

      // 1. Update Public Log (if it's a suggestion) - Mention Only
      if (type === 'sugg' && pubChanId && pubMsgId) {
        const pubChan = interaction.guild.channels.cache.get(pubChanId);
        if (pubChan) {
          const pubMsg = await pubChan.messages.fetch(pubMsgId).catch(() => null);
          if (pubMsg) {
            const oldEmbed = pubMsg.embeds[0];
            const updatedEmbed = EmbedBuilder.from(oldEmbed)
              .setColor(color)
              .setFields({ name: 'Status', value: `${statusLabel}\n**Staff Comment:** ${comment}` });
            
            await pubMsg.edit({ content: `<@${userId}>`, embeds: [updatedEmbed] });
            
            if (pubMsg.thread) {
              await pubMsg.thread.send(`🔒 **Thread Closed.** This suggestion has been ${statusLabel.toLowerCase()}.`);
              await pubMsg.thread.setLocked(true);
              await pubMsg.thread.setArchived(true);
            }
          }
        }
      }

      // 2. DM User (Only for Reports)
      if (type === 'report') {
        const user = await interaction.client.users.fetch(userId).catch(() => null);
        const responseEmbed = new EmbedBuilder()
          .setTitle(`Update on your Report`)
          .setDescription(`Your report has been **${statusLabel}**.`)
          .addFields({ name: 'Staff Comment', value: comment })
          .setColor(color)
          .setTimestamp();

        if (user) await user.send({ embeds: [responseEmbed] }).catch(() => {});
      }

      // 3. Update Log Message
      const logEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(color)
        .addFields({ name: `Decision: ${action.toUpperCase()}`, value: comment });

      return await interaction.update({ embeds: [logEmbed], components: [] });
    }
  }

  // 3. BUTTONS
  if (interaction.isButton()) {
    const parts = interaction.customId.split('_');
    if (parts.length < 3) return;

    const action = parts[0];
    const type = parts[1]; // 'sugg' or 'report'
    const userId = parts[2];
    const pubChanId = parts[3] || '';
    const pubMsgId = parts[4] || '';

    if (['approve', 'deny', 'solve', 'unsolved'].includes(action)) {
      const modal = new ModalBuilder()
        .setCustomId(`dev_comment_modal_v2_${type}_${action}_${userId}_${pubChanId}_${pubMsgId}`)
        .setTitle('Add Developer Comment');

      const input = new TextInputBuilder().setCustomId('dev_comment').setLabel('Your comment to the user').setStyle(TextInputStyle.Paragraph).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return await interaction.showModal(modal);
    }
  }
}
