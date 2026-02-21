import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import musicManager from '../managers/MusicManager.js';

export const category = 'Music';

export const data = new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song in your voice channel')
    .addStringOption(option =>
        option.setName('song')
            .setDescription('Song name or URL')
            .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Connect);

export async function execute(interaction) {
    const query = interaction.options.getString('song');
    const voiceChannel = interaction.member.voice.channel;

    if (!voiceChannel) {
        return interaction.reply({ 
            content: '❌ You need to be in a voice channel!', 
            ephemeral: true 
        });
    }

    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
        return interaction.reply({ 
            content: '❌ I need permissions to join and speak in your voice channel!', 
            ephemeral: true 
        });
    }

    await interaction.deferReply();

    try {
        const song = await musicManager.play(
            interaction.guild.id,
            interaction.channel,
            voiceChannel,
            query,
            interaction.user
        );

        if (!song) {
            return interaction.editReply('❌ No results found for that query!');
        }

        const queue = musicManager.getQueue(interaction.guild.id);
        
        if (queue.songs.length > 1) {
            const position = queue.songs.length - 1;
            await interaction.editReply({
                content: `✅ **${song.title}** has been added to the queue at position #${position}`
            });
        } else {
            await interaction.deleteReply().catch(() => {});
        }
    } catch (error) {
        console.error(error);
        await interaction.editReply('❌ An error occurred while trying to play that song!');
    }
}