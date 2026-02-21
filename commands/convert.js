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
    .setDescription('Download YouTube audio and upload to Discord')
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

    const tempFile = path.join(tempDir, `${videoId}.mp3`);

    try {
        // Get download link from RapidAPI
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
                content: `❌ ${data.msg || 'Failed to get download link'}`,
                ephemeral: true
            });
        }

        // Download the MP3 file
        await interaction.editReply('⬇️ Downloading audio... This may take a moment.');

        await downloadFile(data.link, tempFile);

        // Check file size (Discord limit: 25MB)
        const stats = fs.statSync(tempFile);
        const fileSizeMB = stats.size / (1024 * 1024);

        if (stats.size > 25 * 1024 * 1024) {
            fs.unlinkSync(tempFile);
            return interaction.editReply({
                content: `❌ File too large (${fileSizeMB.toFixed(1)}MB). Maximum is 25MB.\n🔗 [Download externally](${data.link})`,
                ephemeral: true
            });
        }

        // Create attachment
        const attachment = new AttachmentBuilder(tempFile, {
            name: `${data.title?.replace(/[^a-z0-9]/gi, '_') || 'audio'}.mp3`,
            description: `MP3 from YouTube: ${data.title}`
        });

        // Build embed
        const embed = new EmbedBuilder()
            .setTitle('🎵 Audio Downloaded')
            .setDescription(`**${data.title || 'Unknown Title'}**`)
            .setThumbnail(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)
            .setColor(0x00FF00)
            .addFields(
                { 
                    name: 'Duration', 
                    value: data.duration ? `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')}` : 'Unknown', 
                    inline: true 
                },
                { 
                    name: 'File Size', 
                    value: `${fileSizeMB.toFixed(2)} MB`, 
                    inline: true 
                },
                { 
                    name: 'Source', 
                    value: `[YouTube](https://www.youtube.com/watch?v=${videoId})`, 
                    inline: true 
                }
            )
            .setFooter({ text: 'Powered by RapidAPI' })
            .setTimestamp();

        // Send file + embed
        await interaction.editReply({
            embeds: [embed],
            files: [attachment]
        });

        // Clean up temp file
        fs.unlinkSync(tempFile);

    } catch (error) {
        console.error('Convert error:', error);
        
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
        }

        let errorMsg = '⚠️ Error downloading audio. Please try again later.';
        if (error.message.includes('429')) {
            errorMsg = '⏳ Rate limit reached. Please wait a minute.';
        } else if (error.message.includes('403')) {
            errorMsg = '🔒 Video is restricted or private.';
        }

        await interaction.editReply({
            content: errorMsg,
            ephemeral: true
        });
    }
}

export { data, execute };
export default { category, data, execute };