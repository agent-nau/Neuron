import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus } from '@discordjs/voice';
import play from 'play-dl';
import yts from 'yt-search';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

class MusicManager {
    constructor() {
        this.queues = new Map();
        this.players = new Map();
        this.connections = new Map();
    }

    getQueue(guildId) {
        if (!this.queues.has(guildId)) {
            this.queues.set(guildId, {
                songs: [],
                currentIndex: 0,
                playing: false,
                loop: false,
                volume: 100,
                currentMessage: null,
                history: []
            });
        }
        return this.queues.get(guildId);
    }

    async searchSong(query) {
        let video = null;

        try {
            // Check if it's a YouTube URL
            if (query.includes('youtube.com') || query.includes('youtu.be')) {
                const videoInfo = await play.video_info(query);
                video = videoInfo.video_details;
            } else {
                // Use yt-search for better reliability
                const search = await yts(query);
                if (search.videos && search.videos.length > 0) {
                    const firstVideo = search.videos[0];
                    video = {
                        title: firstVideo.title,
                        url: firstVideo.url,
                        duration: firstVideo.duration.timestamp,
                        durationSec: firstVideo.duration.seconds,
                        thumbnail: firstVideo.thumbnail,
                        author: firstVideo.author.name
                    };
                }
            }
        } catch (error) {
            console.error('Search error:', error);
            // Fallback to play-dl search
            try {
                const searchResult = await play.search(query, { limit: 1 });
                if (searchResult && searchResult.length > 0) {
                    video = searchResult[0];
                }
            } catch (fallbackError) {
                console.error('Fallback search also failed:', fallbackError);
            }
        }

        return video;
    }

    async play(guildId, channel, voiceChannel, query, requester) {
        const queue = this.getQueue(guildId);

        const video = await this.searchSong(query);
        if (!video) return null;

        const song = {
            title: video.title || 'Unknown Title',
            url: video.url,
            duration: video.duration || 'Unknown',
            durationSec: video.durationSec || 0,
            thumbnail: video.thumbnail || null,
            author: video.author || 'Unknown',
            requester: requester
        };

        const wasEmpty = queue.songs.length === 0;
        queue.songs.push(song);

        if (!queue.playing && !this.players.has(guildId)) {
            await this.connectAndPlay(guildId, voiceChannel, channel);
            return { song, position: 0, isNowPlaying: true };
        } else {
            const position = queue.songs.length - 1;
            return { song, position, isNowPlaying: false };
        }
    }

    async connectAndPlay(guildId, voiceChannel, textChannel) {
        const queue = this.getQueue(guildId);

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });

        this.connections.set(guildId, connection);

        const player = createAudioPlayer();
        this.players.set(guildId, player);

        connection.subscribe(player);

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            this.cleanup(guildId);
        });

        player.on(AudioPlayerStatus.Idle, () => {
            this.handleSongEnd(guildId, textChannel);
        });

        player.on('error', error => {
            console.error('Audio player error:', error);
            textChannel.send('❌ Error playing audio. Skipping...');
            this.playNext(guildId, textChannel);
        });

        await this.playSong(guildId, textChannel);
    }

    async playSong(guildId, textChannel) {
        const queue = this.getQueue(guildId);
        const player = this.players.get(guildId);

        if (!queue.songs.length || queue.currentIndex >= queue.songs.length) {
            if (queue.loop && queue.songs.length) {
                queue.currentIndex = 0;
            } else {
                this.cleanup(guildId);
                textChannel.send('✅ Queue finished!');
                return;
            }
        }

        const song = queue.songs[queue.currentIndex];

        try {
            const stream = await play.stream(song.url);
            const resource = createAudioResource(stream.stream, {
                inputType: stream.type
            });

            player.play(resource);
            queue.playing = true;

            await this.sendNowPlaying(textChannel, song, queue, guildId);
        } catch (error) {
            console.error('Play error:', error);
            textChannel.send(`❌ Error loading song: ${error.message || 'Unknown error'}. Skipping...`);
            this.playNext(guildId, textChannel);
        }
    }

    async sendQueueMessage(channel, song, position) {
        const embed = new EmbedBuilder()
            .setTitle(`Queued at position #${position}`)
            .setDescription(`[${song.title}](${song.url}) [${song.duration}]`)
            .setThumbnail(song.thumbnail)
            .setColor('#FFA500')
            .setFooter({ 
                text: 'Not the correct track? Try being more specific or use /search' 
            });

        return await channel.send({ embeds: [embed] });
    }

    async sendNowPlaying(channel, song, queue, guildId) {
        if (queue.currentMessage) {
            try {
                await queue.currentMessage.delete();
            } catch (e) {}
        }

        // Build upcoming queue text
        let queueText = '';
        const upcoming = queue.songs.slice(queue.currentIndex + 1, queue.currentIndex + 6);
        if (upcoming.length > 0) {
            queueText = upcoming.map((s, i) => `${i + 1}. [${s.title}](${s.url}) [${s.duration}]`).join('\n');
        } else {
            queueText = '*No upcoming songs*';
        }

        const embed = new EmbedBuilder()
            .setAuthor({
                name: '▶ Now Playing',
                iconURL: song.requester.displayAvatarURL({ dynamic: true })
            })
            .setDescription(`[${song.title}](${song.url}) [${song.duration}]`)
            .addFields(
                { name: 'Up Next', value: queueText }
            )
            .setThumbnail(song.thumbnail)
            .setColor('#FFA500')
            .setFooter({ 
                text: `Track requested by @${song.requester.username}`,
                iconURL: song.requester.displayAvatarURL({ dynamic: true })
            });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('music_pause')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('⏸️'),
                new ButtonBuilder()
                    .setCustomId('music_previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⏮️'),
                new ButtonBuilder()
                    .setCustomId('music_skip')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⏭️'),
                new ButtonBuilder()
                    .setCustomId('music_stop')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⏹️'),
                new ButtonBuilder()
                    .setCustomId('music_queue')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📋')
            );

        const msg = await channel.send({ embeds: [embed], components: [row] });
        queue.currentMessage = msg;
    }

    async updateNowPlaying(guildId, channel, isPaused) {
        const queue = this.getQueue(guildId);
        if (!queue.currentMessage || !queue.songs[queue.currentIndex]) return;

        const song = queue.songs[queue.currentIndex];

        // Build upcoming queue text
        let queueText = '';
        const upcoming = queue.songs.slice(queue.currentIndex + 1, queue.currentIndex + 6);
        if (upcoming.length > 0) {
            queueText = upcoming.map((s, i) => `${i + 1}. [${s.title}](${s.url}) [${s.duration}]`).join('\n');
        } else {
            queueText = '*No upcoming songs*';
        }

        const embed = new EmbedBuilder()
            .setAuthor({
                name: isPaused ? '⏸ Paused' : '▶ Now Playing',
                iconURL: song.requester.displayAvatarURL({ dynamic: true })
            })
            .setDescription(`[${song.title}](${song.url}) [${song.duration}]`)
            .addFields(
                { name: 'Up Next', value: queueText }
            )
            .setThumbnail(song.thumbnail)
            .setColor('#FFA500')
            .setFooter({ 
                text: `Track requested by @${song.requester.username}`,
                iconURL: song.requester.displayAvatarURL({ dynamic: true })
            });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('music_pause')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji(isPaused ? '▶️' : '⏸️'),
                new ButtonBuilder()
                    .setCustomId('music_previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('⏮️'),
                new ButtonBuilder()
                    .setCustomId('music_skip')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⏭️'),
                new ButtonBuilder()
                    .setCustomId('music_stop')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('⏹️'),
                new ButtonBuilder()
                    .setCustomId('music_queue')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('📋')
            );

        await queue.currentMessage.edit({ embeds: [embed], components: [row] });
    }

    handleSongEnd(guildId, textChannel) {
        const queue = this.getQueue(guildId);

        if (queue.songs[queue.currentIndex]) {
            queue.history.push(queue.songs[queue.currentIndex]);
        }

        queue.currentIndex++;

        if (queue.currentIndex < queue.songs.length) {
            this.playSong(guildId, textChannel);
        } else if (queue.loop) {
            queue.currentIndex = 0;
            this.playSong(guildId, textChannel);
        } else {
            this.cleanup(guildId);
            textChannel.send('✅ Finished playing all songs!');
        }
    }

    playNext(guildId, textChannel) {
        const player = this.players.get(guildId);
        if (player) {
            player.stop();
        }
    }

    playPrevious(guildId, textChannel) {
        const queue = this.getQueue(guildId);

        if (queue.history.length > 0) {
            const prevSong = queue.history.pop();
            queue.songs.splice(queue.currentIndex, 0, prevSong);
            queue.currentIndex--;
            this.playNext(guildId, textChannel);
            return true;
        }
        return false;
    }

    pause(guildId) {
        const player = this.players.get(guildId);
        const queue = this.getQueue(guildId);
        if (player && queue.playing) {
            player.pause();
            queue.playing = false;
            return true;
        }
        return false;
    }

    resume(guildId) {
        const player = this.players.get(guildId);
        const queue = this.getQueue(guildId);
        if (player && !queue.playing) {
            player.unpause();
            queue.playing = true;
            return true;
        }
        return false;
    }

    // Stop but keep connection (for button)
    stopOnly(guildId) {
        const queue = this.getQueue(guildId);
        const player = this.players.get(guildId);
        
        if (queue?.currentMessage) {
            queue.currentMessage.delete().catch(() => {});
        }
        
        if (player) {
            player.stop();
        }
        
        queue.songs = [];
        queue.currentIndex = 0;
        queue.playing = false;
        queue.currentMessage = null;
        queue.history = [];
        
        return true;
    }

    // Stop and leave (for /stop command)
    stopAndLeave(guildId) {
        this.cleanup(guildId);
    }

    getQueueList(guildId) {
        const queue = this.getQueue(guildId);
        const current = queue.songs[queue.currentIndex];

        let description = '';
        if (current) {
            description += `**Now Playing:**\n[${current.title}](${current.url}) | \`${current.duration}\` | <@${current.requester.id}>\n\n`;
        }

        const upcoming = queue.songs.slice(queue.currentIndex + 1, queue.currentIndex + 11);
        if (upcoming.length) {
            description += `**Upcoming (${upcoming.length} songs):**\n`;
            upcoming.forEach((song, i) => {
                description += `${i + 1}. [${song.title}](${song.url}) | \`${song.duration}\` | <@${song.requester.id}>\n`;
            });
        } else {
            description += '*No upcoming songs*';
        }

        return description;
    }

    cleanup(guildId) {
        const connection = this.connections.get(guildId);
        const player = this.players.get(guildId);
        const queue = this.queues.get(guildId);

        if (queue?.currentMessage) {
            queue.currentMessage.delete().catch(() => {});
        }

        if (player) {
            player.stop();
            this.players.delete(guildId);
        }

        if (connection) {
            connection.destroy();
            this.connections.delete(guildId);
        }

        this.queues.delete(guildId);
    }
}

export default new MusicManager();