import { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const category = "Utility";

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

    const match = url.match(/(?:v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/i);
    const videoId = match ? match[1] : null;

    if (!videoId) {
        return interaction.reply({
            content: '❌ Invalid YouTube URL.',
            ephemeral: true
        });
    }

    await interaction.deferReply();

    const tempFile = path.join(tempDir, `${videoId}.mp3`);

    try {
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

        await interaction.editReply('⬇️ Downloading audio...');

        await downloadFile(data.link, tempFile);

        const stats = fs.statSync(tempFile);
        const fileSizeMB = stats.size / (1024 * 1024);

        if (stats.size > 25 * 1024 * 1024) {
            fs.unlinkSync(tempFile);
            return interaction.editReply({
                content: `❌ File too large (${fileSizeMB.toFixed(1)}MB). Max 25MB.\n🔗 [Download here](${data.link})`,
                ephemeral: true
            });
        }

        const attachment = new AttachmentBuilder(tempFile, {
            name: `${data.title?.replace(/[^a-z0-9]/gi, '_') || 'audio'}.mp3`
        });

        const embed = new EmbedBuilder()
            .setTitle('🎵 Audio Downloaded')
            .setDescription(`**${data.title || 'Unknown'}**`)
            .setThumbnail(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)
            .setColor(0x00FF00)
            .addFields(
                { name: 'Duration', value: data.duration ? `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')}` : 'Unknown', inline: true },
                { name: 'Size', value: `${fileSizeMB.toFixed(2)} MB`, inline: true }
            );

        await interaction.editReply({
            embeds: [embed],
            files: [attachment]
        });

        fs.unlinkSync(tempFile);

    } catch (error) {
        console.error(error);
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        await interaction.editReply('⚠️ Error downloading audio.');
    }
}

export { data, execute };
export default { category, data, execute };
