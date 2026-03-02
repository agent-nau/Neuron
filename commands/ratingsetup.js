import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { RatingManager } from '../managers/RatingManager.js';

export const data = new SlashCommandBuilder()
    .setName('ratingsetup')
    .setDescription('Setup the rating system panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('Channel to send the rating panel to')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(false)
    );

export async function execute(interaction) {
    // Restrict to support server
    if (process.env.SUPPORT_GUILD_ID && interaction.guildId !== process.env.SUPPORT_GUILD_ID) {
        return interaction.reply({
            content: '❌ This command can only be used in the support server.',
            ephemeral: true
        });
    }

    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
    const ratingManager = new RatingManager(interaction.client);
    
    try {
        await ratingManager.sendRatingPanel(targetChannel);
        
        await interaction.reply({
            content: `✅ Rating panel created in ${targetChannel}`,
            ephemeral: true
        });
    } catch (error) {
        console.error('Error setting up rating panel:', error);
        await interaction.reply({
            content: '❌ Failed to create rating panel. Check bot permissions.',
            ephemeral: true
        });
    }
}