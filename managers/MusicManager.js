import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, VoiceConnectionStatus, StreamType } from '@discordjs/voice';
import play from 'play-dl';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fs from 'node:fs';

// Load cookies if they exist
try {
    if (fs.existsSync('./cookies.json')) {
        const cookies = JSON.parse(fs.readFileSync('./cookies.json', 'utf8'));
        // play-dl can take cookies as a string
        const cookieString = cookies.map(c => `${c.name}=${c.value}`).join('; ');
        await play.setToken({
            youtube: {
                cookie: cookieString
            }
        });
        console.log('✅ Loaded YouTube cookies into play-dl');
    }
} catch (error) {
    console.error('❌ Error loading cookies.json:', error);
}

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
        try {
            // Check if it's a YouTube URL
            const isYouTubeUrl = play.yt_validate(query) === 'video';
            
            let video;
            if (isYouTubeUrl) {
                const info = await play.video_info(query);
                video = info.video_details;
            } else {
                // Specify source as youtube to be explicit
                const searchResults = await play.search(query, { 
                    limit: 1,
                    source: { youtube: 'video' }
                });
                if (!searchResults || searchResults.length === 0) return null;
                video = searchResults[0];
            }

            return {
                title: video.title || 'Unknown Title',
                url: video.url,
                duration: video.durationRaw || '0:00',
                durationSec: video.durationInSec || 0,
                thumbnail: video.thumbnails?.[video.thumbnails.length - 1]?.url || null,
                author: video.channel?.name || 'Unknown'
            };
        } catch (error) {
            console.error('Search error:', error);
            return null;
        }
    }

    async play(guildId, channel, voiceChannel, query, requester) {
        const queue = this.getQueue(guildId);

        const video = await this.searchSong(query);
        if (!video) return null;

        const song = {
            title: video.title,
            url: video.url,
            duration: video.duration,
            durationSec: video.durationSec,
            thumbnail: video.thumbnail,
            author: video.author,
            requester: requester
        };

        queue.songs.push(song);

        // Connect and play if not currently playing or no active connection
        if (!queue.playing || !this.connections.has(guildId)) {
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
            selfDeaf: false,
            selfMute: false
        });

        this.connections.set(guildId, connection);

        const player = createAudioPlayer();
        this.players.set(guildId, player);

        connection.subscribe(player);

        connection.on(VoiceConnectionStatus.Disconnected, () => {
            this.cleanup(guildId);
        });

        connection.on('error', (error) => {
            console.error('Voice connection error:', error);
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
                inputType: stream.type,
                inlineVolume: true
            });

            resource.volume?.setVolume((queue.volume || 100) / 100);

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
            this.players.delete(guildId);
        }

        // Also destroy the voice connection so next /play reconnects cleanly
        const connection = this.connections.get(guildId);
        if (connection) {
            connection.destroy();
            this.connections.delete(guildId);
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