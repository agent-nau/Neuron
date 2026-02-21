import { SlashCommandBuilder } from 'discord.js';
import musicManager from '../managers/MusicManager.js';

export const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playing and clear the queue');

export async function execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    const botChannel = interaction.guild.members.me.voice.channel;
    
    if (!voiceChannel || (botChannel && voiceChannel.id !== botChannel.id)) {
        return interaction.reply({ 
            content: '❌ You need to be in the same voice channel as me!', 
            ephemeral: true 
        });
    }

    musicManager.stop(interaction.guild.id);
    await interaction.reply('⏹️ Stopped the music and cleared the queue');
}