const { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus,
    VoiceConnectionStatus
} = require('@discordjs/voice');
const play = require('play-dl');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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

    async play(guildId, channel, voiceChannel, query, requester) {
        const queue = this.getQueue(guildId);
        
        const searchResult = await play.search(query, { limit: 1 });
        if (!searchResult.length) return null;
        
        const video = searchResult[0];
        const song = {
            title: video.title,
            url: video.url,
            duration: video.durationRaw,
            durationSec: video.durationInSec,
            thumbnail: video.thumbnails[0]?.url,
            author: video.channel?.name,
            requester: requester
        };

        queue.songs.push(song);

        if (!queue.playing && !this.players.has(guildId)) {
            await this.connectAndPlay(guildId, voiceChannel, channel);
        } else {
            // Just added to queue, update message if exists
            if (queue.currentMessage) {
                await this.updateNowPlaying(guildId, channel, false);
            }
        }

        return song;
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
            textChannel.send('❌ Error loading song. Skipping...');
            this.playNext(guildId, textChannel);
        }
    }

    async sendNowPlaying(channel, song, queue, guildId) {
        // Delete old message if exists
        if (queue.currentMessage) {
            try {
                await queue.currentMessage.delete();
            } catch (e) {}
        }

        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: '|  Now playing', 
                iconURL: song.requester.displayAvatarURL({ dynamic: true }) 
            })
            .setDescription(`**[${song.title}](${song.url})**`)
            .addFields(
                { name: 'Artist', value: song.author || 'Unknown', inline: true },
                { name: 'Duration', value: song.duration || 'Unknown', inline: true },
                { name: 'Requested by', value: `<@${song.requester.id}>`, inline: true }
            )
            .setThumbnail(song.thumbnail || null)
            .setColor('#FFA500') // Orange accent like Chip bot
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('music_pause')
                    .setLabel('Pause & Resume')
                    .setStyle(ButtonStyle.Success), // Green
                new ButtonBuilder()
                    .setCustomId('music_skip')
                    .setLabel('Skip')
                    .setStyle(ButtonStyle.Primary), // Blue
                new ButtonBuilder()
                    .setCustomId('music_stop')
                    .setLabel('Stop')
                    .setStyle(ButtonStyle.Danger), // Red
                new ButtonBuilder()
                    .setCustomId('music_queue')
                    .setLabel('Show Queue')
                    .setStyle(ButtonStyle.Secondary) // Gray
            );

        const msg = await channel.send({ embeds: [embed], components: [row] });
        queue.currentMessage = msg;
    }

    async updateNowPlaying(guildId, channel, isPaused) {
        const queue = this.getQueue(guildId);
        if (!queue.currentMessage || !queue.songs[queue.currentIndex]) return;

        const song = queue.songs[queue.currentIndex];
        
        const embed = new EmbedBuilder()
            .setAuthor({ 
                name: '|  Now playing', 
                iconURL: song.requester.displayAvatarURL({ dynamic: true }) 
            })
            .setDescription(`**[${song.title}](${song.url})**`)
            .addFields(
                { name: 'Artist', value: song.author || 'Unknown', inline: true },
                { name: 'Duration', value: song.duration || 'Unknown', inline: true },
                { name: 'Requested by', value: `<@${song.requester.id}>`, inline: true },
                { name: 'Status', value: isPaused ? '⏸️ Paused' : '▶️ Playing', inline: true }
            )
            .setThumbnail(song.thumbnail || null)
            .setColor('#FFA500')
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(isPaused ? 'music_resume' : 'music_pause')
                    .setLabel(isPaused ? 'Resume' : 'Pause & Resume')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('music_skip')
                    .setLabel('Skip')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('music_stop')
                    .setLabel('Stop')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('music_queue')
                    .setLabel('Show Queue')
                    .setStyle(ButtonStyle.Secondary)
            );

        await queue.currentMessage.edit({ embeds: [embed], components: [row] });
    }

    handleSongEnd(guildId, textChannel) {
        const queue = this.getQueue(guildId);
        
        // Save to history
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

    stop(guildId) {
        const queue = this.getQueue(guildId);
        if (queue.currentMessage) {
            queue.currentMessage.delete().catch(() => {});
        }
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
            description += **Upcoming (${upcoming.length} songs):**\n`;
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
        
        if (connection) {
            connection.destroy();
            this.connections.delete(guildId);
        }
        if (player) {
            player.stop();
            this.players.delete(guildId);
        }
        
        this.queues.delete(guildId);
    }
}

module.exports = new MusicManager();