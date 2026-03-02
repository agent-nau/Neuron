import { SlashCommandBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { setRatingsChannel, getRatingsChannel } from '../managers/ratingData.js';

export const data = new SlashCommandBuilder()
    .setName('ratingchannel')
    .setDescription('Set or view the ratings log channel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('Channel to send anonymous ratings to')
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

    const channel = interaction.options.getChannel('channel');
    
    if (!channel) {
        // View current channel
        const current = await getRatingsChannel(interaction.guildId);
        if (current) {
            return interaction.reply({
                content: `📋 Current ratings channel: <#${current}>`,
                ephemeral: true
            });
        } else {
            return interaction.reply({
                content: '❌ No ratings channel set. Use `/ratingchannel #channel` to set one.',
                ephemeral: true
            });
        }
    }
    
    // Set new channel
    await setRatingsChannel(interaction.guildId, channel.id);
    
    await interaction.reply({
        content: `✅ Ratings will be logged to ${channel}`,
        ephemeral: true
    });
}