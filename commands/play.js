import { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } from 'discord.js';
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
            flags: MessageFlags.Ephemeral
        });
    }

    const permissions = voiceChannel.permissionsFor(interaction.client.user);
    if (!permissions.has('Connect') || !permissions.has('Speak')) {
        return interaction.reply({
            content: '❌ I need permissions to join and speak in your voice channel!',
            flags: MessageFlags.Ephemeral
        });
    }

    await interaction.deferReply();

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
            await interaction.deleteReply().catch(() => {});
        } else {
            await interaction.editReply({
                content: `**Queued at position #${position}**\n[${song.title}](${song.url}) [${song.duration}]\n\n*Not the correct track? Try being more specific or use /search*`
            });
        }
    } catch (error) {
        console.error(error);
        await interaction.editReply('❌ An error occurred while trying to play that song!');
    }
}