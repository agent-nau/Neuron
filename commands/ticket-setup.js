import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import { QuickDB } from 'quick.db';

const db = new QuickDB();

export const data = new SlashCommandBuilder()
  .setName('panel')
  .setDescription('Ticket/Ratings/Suggestions/Reports panel system')
  .addSubcommand(sub =>
    sub.setName('setup')
      .setDescription('Post panel')
      .addChannelOption(o =>
        o.setName('channel')
          .setDescription('Channel to post the panel')
          .setRequired(true))
      .addChannelOption(o =>
        o.setName('category')
          .setDescription('Category where tickets will be created')
          .setRequired(true))
  );

export async function execute(interaction) {
  const channel = interaction.options.getChannel('channel');
  const category = interaction.options.getChannel('category');

  const panelEmbed = new EmbedBuilder()
    .setTitle('📋 Support Panel')
    .setDescription('Choose an option below:\n- Tickets\n- Ratings\n- Suggestions\n- Reports')
    .setColor(0x00AE86);

  const selectRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('panel_select')
      .setPlaceholder('Select an option...')
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
    if (interaction.customId === 'ratings_modal') {
      const rating = interaction.fields.getTextInputValue('rating_value');
      const comment = interaction.fields.getTextInputValue('rating_comment');
      const anon = interaction.fields.getTextInputValue('rating_anon').toLowerCase();

      await db.push('ratings', {
        user: interaction.user.id,
        rating,
        comment,
        anonymous: anon === 'yes'
      });

      await interaction.reply({ content: '✅ Rating submitted!', ephemeral: true });
    }

    if (interaction.customId === 'suggestions_modal') {
      const suggestion = interaction.fields.getTextInputValue('suggestion_text');
      await db.push('suggestions', { user: interaction.user.id, suggestion });
      await interaction.reply({ content: '💡 Suggestion submitted!', ephemeral: true });
    }

    if (interaction.customId === 'reports_modal') {
      const report = interaction.fields.getTextInputValue('report_text');
      await db.push('reports', { user: interaction.user.id, report });
      await interaction.reply({ content: '🚨 Report submitted!', ephemeral: true });
    }
  }
}
