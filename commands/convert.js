import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const category = "Utility";

const data = new SlashCommandBuilder()
    .setName('convert')
    .setDescription('Convert YouTube video to MP3')
    .addStringOption(option =>
        option.setName('url')
            .setDescription('YouTube video URL')
            .setRequired(true));

async function execute(interaction) {
    const url = interaction.options.getString('url');

    // Extract video ID
    const match = url.match(/(?:v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i);
    const videoId = match ? match[1] : null;

    if (!videoId) {
        return interaction.reply({
            content: '❌ Invalid YouTube URL.\nExamples:\n• `https://www.youtube.com/watch?v=UxxajLWwzqY`\n• `https://youtu.be/UxxajLWwzqY`',
            ephemeral: true
        });
    }

    await interaction.deferReply();

    try {
        // Call RapidAPI
        const apiUrl = `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`;
        
        const apiResponse = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': 'youtube-mp36.p.rapidapi.com'
            }
        });

        if (!apiResponse.ok) {
            throw new Error(`API Error: ${apiResponse.status}`);
        }

        const data = await apiResponse.json();

        if (data.status !== 'ok' || !data.link) {
            return interaction.editReply({
                content: `❌ ${data.msg || 'Failed to convert video'}`,
                ephemeral: true
            });
        }

        // Format duration
        const durationMin = Math.floor(data.duration / 60);
        const durationSec = Math.floor(data.duration % 60).toString().padStart(2, '0');
        const fileSizeMB = (data.filesize / (1024 * 1024)).toFixed(2);

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle('🎵 YouTube to MP3')
            .setDescription(`**${data.title}**`)
            .setThumbnail(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)
            .setColor(0xFF0000)
            .addFields(
                { 
                    name: '⏱️ Duration', 
                    value: `${durationMin}:${durationSec}`, 
                    inline: true 
                },
                { 
                    name: '💾 File Size', 
                    value: `${fileSizeMB} MB`, 
                    inline: true 
                },
                { 
                    name: '✅ Status', 
                    value: 'Ready for download', 
                    inline: true 
                }
            )
            .setFooter({ text: 'Powered by RapidAPI • Link expires in ~1 hour' })
            .setTimestamp();

        // Buttons - direct download link
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

        await interaction.editReply({
            embeds: [embed],
            components: [row]
        });

    } catch (error) {
        console.error('Convert error:', error);
        
        let errorMsg = '⚠️ Error converting video. Please try again later.';
        if (error.message.includes('429')) {
            errorMsg = '⏳ Rate limit reached. Please wait a minute.';
        } else if (error.message.includes('403')) {
            errorMsg = '🔒 Video is restricted or private.';
        } else if (error.message.includes('404')) {
            errorMsg = '❌ Video not found or API temporarily unavailable.';
        }

        await interaction.editReply({
            content: errorMsg,
            ephemeral: true
        });
    }
}

export { data, execute };
export default { category, data, execute };
