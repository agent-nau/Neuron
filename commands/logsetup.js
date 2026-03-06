import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { QuickDB } from 'quick.db';

const db = new QuickDB();

export const data = new SlashCommandBuilder()
    .setName('logsetup')
    .setDescription('Configure logging channels for the support panel')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sub =>
        sub.setName('set')
            .setDescription('Set a logging channel')
            .addStringOption(o => 
                o.setName('type')
                    .setDescription('The type of logs to configure')
                    .setRequired(true)
                    .addChoices(
                        { name: 'Ratings', value: 'rating_logs' },
                        { name: 'Suggestions', value: 'suggestion_logs' },
                        { name: 'Reports', value: 'report_logs' }
                    ))
            .addChannelOption(o => 
                o.setName('channel')
                    .setDescription('The channel to send logs to')
                    .setRequired(true)
                    .addChannelTypes(ChannelType.GuildText)))
    .addSubcommand(sub =>
        sub.setName('view')
            .setDescription('View current log configurations'));

export async function execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const configKey = `guild_${interaction.guild.id}_config`;

    if (subcommand === 'set') {
        const type = interaction.options.getString('type');
        const channel = interaction.options.getChannel('channel');

        let config = await db.get(configKey) || {};
        config[type] = channel.id;
        
        await db.set(configKey, config);

        await interaction.reply({
            content: `✅ Successfully set **${type.replace('_', ' ')}** to ${channel}`,
            ephemeral: true
        });
    }

    if (subcommand === 'view') {
        const config = await db.get(configKey);

        const embed = new EmbedBuilder()
            .setTitle('📋 Log Configurations')
            .setDescription('Current logging channels for the support panel:')
            .addFields(
                { name: '🌟 Rating Logs', value: config?.rating_logs ? `<#${config.rating_logs}>` : 'Not set', inline: true },
                { name: '💡 Suggestion Logs', value: config?.suggestion_logs ? `<#${config.suggestion_logs}>` : 'Not set', inline: true },
                { name: '🚨 Report Logs', value: config?.report_logs ? `<#${config.report_logs}>` : 'Not set', inline: true }
            )
            .setColor(0x00AE86);

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}
