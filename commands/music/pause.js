import { SlashCommandBuilder } from 'discord.js';
import musicManager from '../../managers/MusicManager.js';

export const data = new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Pause or resume the current song');

export async function execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    const botChannel = interaction.guild.members.me.voice.channel;
    
    if (!voiceChannel || (botChannel && voiceChannel.id !== botChannel.id)) {
        return interaction.reply({ 
            content: '❌ You need to be in the same voice channel as me!', 
            ephemeral: true 
        });
    }

    const queue = musicManager.getQueue(interaction.guild.id);
    
    if (queue.playing) {
        musicManager.pause(interaction.guild.id);
        await musicManager.updateNowPlaying(interaction.guild.id, interaction.channel, true);
        await interaction.reply('⏸️ Paused the music');
    } else {
        musicManager.resume(interaction.guild.id);
        await musicManager.updateNowPlaying(interaction.guild.id, interaction.channel, false);
        await interaction.reply('▶️ Resumed the music');
    }
}