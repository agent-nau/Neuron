import { Events, EmbedBuilder } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';
import musicManager from '../managers/MusicManager.js';

export const name = Events.InteractionCreate;
export async function execute(interaction) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('music_')) return;

    const action = interaction.customId.replace('music_', '');
    const guildId = interaction.guild.id;

    const voiceChannel = interaction.member.voice.channel;
    const botChannel = interaction.guild.members.me.voice.channel;

    if (!voiceChannel) {
        return interaction.reply({
            content: '❌ You need to be in a voice channel!',
            ephemeral: true
        });
    }

    if (botChannel && voiceChannel.id !== botChannel.id) {
        return interaction.reply({
            content: '❌ You need to be in the same voice channel as me!',
            ephemeral: true
        });
    }

    await interaction.deferUpdate();

    switch (action) {
        case 'pause':
            const queue = musicManager.getQueue(guildId);
            if (queue.playing) {
                const paused = musicManager.pause(guildId);
                if (paused) {
                    await musicManager.updateNowPlaying(guildId, interaction.channel, true);
                    await interaction.followUp({
                        content: '⏸️ Paused the music',
                        ephemeral: true
                    });
                }
            } else {
                const resumed = musicManager.resume(guildId);
                if (resumed) {
                    await musicManager.updateNowPlaying(guildId, interaction.channel, false);
                    await interaction.followUp({
                        content: '▶️ Resumed the music',
                        ephemeral: true
                    });
                }
            }
            break;

        case 'skip':
            musicManager.playNext(guildId, interaction.channel);
            await interaction.followUp({
                content: '⏭️ Skipped to the next song',
                ephemeral: true
            });
            break;

        case 'previous':
            const hasPrevious = musicManager.playPrevious(guildId, interaction.channel);
            if (hasPrevious) {
                await interaction.followUp({
                    content: '⏮️ Playing previous song',
                    ephemeral: true
                });
            } else {
                await interaction.followUp({
                    content: '❌ No previous songs in history',
                    ephemeral: true
                });
            }
            break;

        case 'stop':
            musicManager.stop(interaction.guild.id);
            
            const connection = getVoiceConnection(interaction.guild.id);
            if (connection) {
                connection.destroy();
            }
            
            await interaction.followUp({
                content: '⏹️ Stopped the music, cleared the queue, and left the voice channel',
                ephemeral: true
            });
            break;

        case 'queue':
            const queueList = musicManager.getQueueList(guildId);

            const embed = new EmbedBuilder()
                .setTitle('🎵 Music Queue')
                .setDescription(queueList)
                .setColor('#FFA500')
                .setTimestamp();

            await interaction.followUp({
                embeds: [embed],
                ephemeral: true
            });
            break;
    }
}