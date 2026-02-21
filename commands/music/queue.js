const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const musicManager = require('../../managers/MusicManager');

export const category = 'Music';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the current music queue'),

    async execute(interaction) {
        const queueList = musicManager.getQueueList(interaction.guild.id);
        
        const embed = new EmbedBuilder()
            .setTitle('🎵 Music Queue')
            .setDescription(queueList)
            .setColor('#FFA500')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};