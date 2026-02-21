import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const category = "Utility";

// Auto-create temp directory if it doesn't exist
const tempDir = path.join(__dirname, '..', 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

const data = new SlashCommandBuilder()
    .setName('convert')
    .setDescription('Download YouTube audio/video')
    .addStringOption(option =>
        option.setName('format')
            .setDescription('Format (mp3, videos, mergedstreams, videostreams, audiostreams)')
            .setRequired(true))
    .addStringOption(option =>
        option.setName('url')
            .setDescription('YouTube video URL')
            .setRequired(true));

async function downloadFile(url, outputPath) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed: ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(outputPath, Buffer.from(buffer));
    
    return outputPath;
}

async function execute(interaction) {
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
}

export { data, execute };
export default { category, data, execute };
