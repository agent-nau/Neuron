import { Events, EmbedBuilder, MessageFlags } from 'discord.js';
import musicManager from '../managers/MusicManager.js';

export const name = Events.InteractionCreate;
export async function execute(interaction) {
    if (!interaction.isButton()) return;
    if (!interaction.customId.startsWith('music_')) return;

    const action = interaction.customId.replace('music_', '');
    const guildId = interaction.guild.id;

    // Fetch fresh member data to ensure voice state is current
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const voiceChannel = member.voice.channel;

    if (!voiceChannel) {
        return interaction.reply({
            content: '❌ You need to be in a voice channel!',
            flags: MessageFlags.Ephemeral
        });
    }

    // Check if bot is in a voice channel
    const botMember = await interaction.guild.members.fetch(interaction.client.user.id);
    const botVoiceChannel = botMember.voice.channel;

    // If bot is in a voice channel, user must be in the same one
    if (botVoiceChannel && voiceChannel.id !== botVoiceChannel.id) {
        return interaction.reply({
            content: '❌ You need to be in the same voice channel as me!',
            flags: MessageFlags.Ephemeral
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
                        flags: MessageFlags.Ephemeral
                    });
                }
            } else {
                const resumed = musicManager.resume(guildId);
                if (resumed) {
                    await musicManager.updateNowPlaying(guildId, interaction.channel, false);
                    await interaction.followUp({
                        content: '▶️ Resumed the music',
                        flags: MessageFlags.Ephemeral
                    });
                }
            }
            break;

        case 'skip':
            musicManager.playNext(guildId, interaction.channel);
            await interaction.followUp({
                content: '⏭️ Skipped to the next song',
                flags: MessageFlags.Ephemeral
            });
            break;

        case 'previous':
            const hasPrevious = musicManager.playPrevious(guildId, interaction.channel);
            if (hasPrevious) {
                await interaction.followUp({
                    content: '⏮️ Playing previous song',
                    flags: MessageFlags.Ephemeral
                });
            } else {
                await interaction.followUp({
                    content: '❌ No previous songs in history',
                    flags: MessageFlags.Ephemeral
                });
            }
            break;

        case 'stop':
            musicManager.stopOnly(interaction.guild.id);
            await interaction.followUp({
                content: '⏹️ Stopped the music and cleared the queue',
                flags: MessageFlags.Ephemeral
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
                flags: MessageFlags.Ephemeral
            });
            break;
    }
}