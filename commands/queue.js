import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import musicManager from '../managers/MusicManager.js';

export const data = new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current music queue');

export async function execute(interaction) {
    const queueList = musicManager.getQueueList(interaction.guild.id);
    
    const embed = new EmbedBuilder()
        .setTitle('🎵 Music Queue')
        .setDescription(queueList)
        .setColor('#FFA500')
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}