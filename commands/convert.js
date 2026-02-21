import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fetch from 'node-fetch';

export const category = "Utility";

const data = new SlashCommandBuilder()
    .setName('convert')
    .setDescription('Download YouTube audio/video via RapidAPI')
    .addStringOption(option =>
        option.setName('url')
            .setDescription('YouTube video URL')
            .setRequired(true));

async function execute(interaction) {
    const url = interaction.options.getString('url');

    // Extract video ID from URL
    const match = url.match(/(?:v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    const videoId = match ? match[1] : null;

    if (!videoId) {
        return interaction.reply({
            content: '❌ Invalid YouTube URL. Please provide a valid YouTube link.',
            ephemeral: true
        });
    }

    await interaction.deferReply();

    try {
        // Call RapidAPI
        const apiUrl = `https://youtube-to-mp3-converter2.p.rapidapi.com/?videoId=${videoId}`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': 'youtube-to-mp3-converter2.p.rapidapi.com'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        // Check if API returned valid data
        if (!data || !data.link || !data.title) {
            return interaction.editReply({
                content: '❌ Could not fetch download link. The video may be restricted or unavailable.',
                ephemeral: true
            });
        }

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle(data.title || 'YouTube Video')
            .setURL(`https://www.youtube.com/watch?v=${videoId}`)
            .setDescription(data.info || 'Your MP3 is ready for download!')
            .setThumbnail(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)
            .setColor(0xFF0000)
            .addFields(
                { name: 'Duration', value: data.duration || 'Unknown', inline: true },
                { name: 'Quality', value: data.quality || 'MP3 128kbps', inline: true }
            )
            .setFooter({ text: 'Powered by RapidAPI' });

        // Buttons
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Watch on YouTube')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://www.youtube.com/watch?v=${videoId}`),
            new ButtonBuilder()
                .setLabel('Download MP3')
                .setStyle(ButtonStyle.Link)
                .setURL(data.link)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
        console.error('Convert error:', error);
        await interaction.editReply({
            content: '⚠️ Error converting video. Please try again later.',
            ephemeral: true
        });
    }
}

export { data, execute };
export default { category, data, execute };
