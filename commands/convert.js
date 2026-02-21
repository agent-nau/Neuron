import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const category = "Utility";

const data = new SlashCommandBuilder()
    .setName('convert')
    .setDescription('Download YouTube audio via RapidAPI')
    .addStringOption(option =>
        option.setName('url')
            .setDescription('YouTube video URL')
            .setRequired(true));

async function execute(interaction) {
    const url = interaction.options.getString('url');

    // Extract video ID from various YouTube URL formats
    const match = url.match(/(?:v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i);
    const videoId = match ? match[1] : null;

    if (!videoId) {
        return interaction.reply({
            content: '❌ Invalid YouTube URL. Please provide a valid YouTube link.\nExamples:\n• `https://www.youtube.com/watch?v=UxxajLWwzqY`\n• `https://youtu.be/UxxajLWwzqY`',
            ephemeral: true
        });
    }

    await interaction.deferReply();

    try {
        // Call RapidAPI youtube-mp36
        const apiUrl = `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`;
        
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com'
            }
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();

        // Check API response status
        if (data.status !== 'ok') {
            return interaction.editReply({
                content: `❌ API Error: ${data.msg || 'Failed to convert video'}`,
                ephemeral: true
            });
        }

        if (!data.link) {
            return interaction.editReply({
                content: '❌ Download link not available. The video may be restricted, too long, or blocked.',
                ephemeral: true
            });
        }

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle(data.title || 'YouTube Video')
            .setURL(`https://www.youtube.com/watch?v=${videoId}`)
            .setDescription('✅ Your MP3 is ready for download!')
            .setThumbnail(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)
            .setColor(0xFF0000)
            .addFields(
                { 
                    name: 'Duration', 
                    value: data.duration ? `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')}` : 'Unknown', 
                    inline: true 
                },
                { 
                    name: 'Quality', 
                    value: 'MP3 128kbps', 
                    inline: true 
                }
            )
            .setFooter({ text: 'Powered by RapidAPI' })
            .setTimestamp();

        // Buttons
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('⬇️ Download MP3')
                .setStyle(ButtonStyle.Link)
                .setURL(data.link),
            new ButtonBuilder()
                .setLabel('▶️ Watch on YouTube')
                .setStyle(ButtonStyle.Link)
                .setURL(`https://www.youtube.com/watch?v=${videoId}`)
        );

        await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
        console.error('Convert error:', error);
        
        let errorMsg = '⚠️ Error converting video. Please try again later.';
        if (error.message.includes('429')) {
            errorMsg = '⏳ Rate limit reached. Please wait a minute and try again.';
        } else if (error.message.includes('403')) {
            errorMsg = '🔒 This video is restricted or private.';
        } else if (error.message.includes('404')) {
            errorMsg = '❌ Video not found. Please check the URL.';
        }
        
        await interaction.editReply({
            content: errorMsg,
            ephemeral: true
        });
    }
}

export { data, execute };
export default { category, data, execute };
