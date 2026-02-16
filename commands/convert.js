import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const category = "Utility";

export default {
    data: new SlashCommandBuilder()
        .setName('convert')
        .setDescription('Download YouTube audio/video')
        .addStringOption(option =>
            option.setName('format')
                .setDescription('Format (mp3, videos, mergedstreams, videostreams, audiostreams)')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('url')
                .setDescription('YouTube video URL')
                .setRequired(true)),

    async execute(interaction) {
        const format = interaction.options.getString('format');
        const url = interaction.options.getString('url');

        // Extract video ID from URL
        const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        const videoId = match ? match[1] : null;

        if (!videoId) {
            return interaction.reply('❌ Invalid YouTube URL.');
        }

        try {
            const res = await fetch(
                `https://api.download-lagu-mp3.com/@api/json/${format}/${videoId}`
            );
            const data = await res.json();

            if (!data || !data.link) {
                return interaction.reply('❌ Could not fetch download link. Please check the format and video ID.');
            }

            // Build embed
            const embed = new EmbedBuilder()
                .setTitle(data.title || 'YouTube Video')
                .setURL(`https://www.youtube.com/watch?v=${videoId}`)
                .setDescription(data.info || 'Here is your requested video/audio.')
                .setThumbnail(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)
                .setColor(0xff0000);

            // Buttons
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Watch on YouTube')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://www.youtube.com/watch?v=${videoId}`),
                new ButtonBuilder()
                    .setLabel('Download')
                    .setStyle(ButtonStyle.Link)
                    .setURL(data.link)
            );

            await interaction.reply({ embeds: [embed], components: [row] });
        } catch (err) {
            console.error(err);
            await interaction.reply('⚠️ Error fetching the download link.');
        }
    },
};