import { SlashCommandBuilder } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';
import musicManager from '../managers/MusicManager.js';

export const category = 'Music';

export const data = new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playing, clear the queue, and leave the voice channel');

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
    
    const connection = getVoiceConnection(interaction.guild.id);
    if (connection) {
        connection.destroy();
    }

    await interaction.reply('⏹️ Stopped the music, cleared the queue, and left the voice channel');
}