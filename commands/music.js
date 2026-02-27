import {
    SlashCommandBuilder,
    EmbedBuilder,
    PermissionFlagsBits,
    MessageFlags
} from 'discord.js';
import musicManager from '../managers/MusicManager.js';

// ─────────────────────────────────────────────
//  Helper: check voice channel
// ─────────────────────────────────────────────
function voiceCheck(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    const botChannel = interaction.guild.members.me.voice.channel;
    if (!voiceChannel) return '❌ You need to be in a voice channel!';
    if (botChannel && voiceChannel.id !== botChannel.id) return '❌ You need to be in the same voice channel as me!';
    return null;
}

// ─────────────────────────────────────────────
//  /play
// ─────────────────────────────────────────────
const play = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Play a song in your voice channel')
        .addStringOption(option =>
            option.setName('song')
                .setDescription('Song name or YouTube URL')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Connect),

    async execute(interaction) {
        // Immediately defer reply to prevent 3s timeout
        try {
            await interaction.deferReply();
        } catch (error) {
            console.error('Failed to defer reply:', error);
            // If defer fails, we likely can't respond at all
            return;
        }

        const query = interaction.options.getString('song');

        // Fetch fresh member to ensure voice state is current
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            return interaction.editReply({
                content: '❌ You need to be in a voice channel!'
            });
        }

        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions.has('Connect') || !permissions.has('Speak')) {
            return interaction.editReply({
                content: '❌ I need permissions to join and speak in your voice channel!'
            });
        }

        try {
            const result = await musicManager.play(
                interaction.guild.id,
                interaction.channel,
                voiceChannel,
                query,
                interaction.user
            );

            if (!result) {
                return interaction.editReply('❌ No results found for that query!');
            }

            const { song, position, isNowPlaying } = result;

            if (isNowPlaying) {
                // Now-playing embed is sent to the channel by MusicManager — dismiss the deferred reply
                await interaction.deleteReply().catch(() => {});
            } else {
                await interaction.editReply({
                    content: `**Queued at position #${position}**\n[${song.title}](${song.url}) [${song.duration}]\n\n*Not the correct track? Try being more specific.*`
                });
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply('❌ An error occurred while trying to play that song!');
        }
    }
};

// ─────────────────────────────────────────────
//  /pause
// ─────────────────────────────────────────────
const pause = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pause or resume the current song'),

    async execute(interaction) {
        const err = voiceCheck(interaction);
        if (err) return interaction.reply({ content: err, flags: MessageFlags.Ephemeral });

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
};

// ─────────────────────────────────────────────
//  /skip
// ─────────────────────────────────────────────
const skip = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip to the next song'),

    async execute(interaction) {
        const err = voiceCheck(interaction);
        if (err) return interaction.reply({ content: err, flags: MessageFlags.Ephemeral });

        musicManager.playNext(interaction.guild.id, interaction.channel);
        await interaction.reply('⏭️ Skipped to the next song!');
    }
};

// ─────────────────────────────────────────────
//  /stop
// ─────────────────────────────────────────────
const stop = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stop playing, clear the queue, and leave the voice channel'),

    async execute(interaction) {
        const err = voiceCheck(interaction);
        if (err) return interaction.reply({ content: err, flags: MessageFlags.Ephemeral });

        musicManager.stopAndLeave(interaction.guild.id);
        await interaction.reply('⏹️ Stopped the music, cleared the queue, and left the voice channel');
    }
};

// ─────────────────────────────────────────────
//  /queue
// ─────────────────────────────────────────────
const queue = {
    category: 'Music',
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Show the current music queue'),

    async execute(interaction) {
        const queueList = musicManager.getQueueList(interaction.guild.id);

        const embed = new EmbedBuilder()
            .setTitle('🎵 Music Queue')
            .setDescription(queueList || '*The queue is empty*')
            .setColor('#FFA500')
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};

// ─────────────────────────────────────────────
//  Export all 5 commands as an array
// ─────────────────────────────────────────────
export const commands = [play, pause, skip, stop, queue];
