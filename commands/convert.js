// commands/convert.js
import fs from "fs";
import path from "path";
import fetch from "node-fetch";
import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

async function downloadFile(url, outputPath) {
  const response = await fetch(url, {
    headers: { "User-Agent": "DiscordBot/1.0" } // helps with some CDNs
  });
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));
  return outputPath;
}

export const data = new SlashCommandBuilder()
  .setName("convert")
  .setDescription("Convert a YouTube video to MP3")
  .addStringOption(option =>
    option.setName("url")
      .setDescription("YouTube video URL")
      .setRequired(true)
  );

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const url = interaction.options.getString("url");
    const videoIdMatch = url.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
    if (!videoIdMatch) {
      return interaction.editReply("❌ Invalid YouTube URL.");
    }

    const videoId = videoIdMatch[1];
    const apiUrl = `https://youtube-mp36.p.rapidapi.com/dl?id=${videoId}`;

    const response = await fetch(apiUrl, {
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": "youtube-mp36.p.rapidapi.com"
      }
    });

    const data = await response.json();
    console.log("API response:", data);

    if (data.status !== "ok" || !data.link) {
      return interaction.editReply(`⚠️ API error: ${data.msg || "No download link returned."}`);
    }

    const filename = `${videoId}.mp3`;
    const tempFile = path.join("temp", filename);

    try {
      await downloadFile(data.link, tempFile);
    } catch (err) {
      return interaction.editReply(`⚠️ Could not download audio: ${err.message}`);
    }

    // Build the embed
    const embed = new EmbedBuilder()
      .setTitle(data.title || "Converted Audio")
      .setURL(url)
      .setDescription("Here’s your converted MP3 file!")
      .setThumbnail(data.thumb || "https://i.imgur.com/AfFp7pu.png") // fallback thumbnail
      .addFields(
        { name: "Duration", value: `${Math.floor(data.duration)}s`, inline: true },
        { name: "File Size", value: `${(data.filesize / 1024 / 1024).toFixed(2)} MB`, inline: true }
      )
      .setColor(0x1DB954)
      .setFooter({ text: "Powered by YouTube MP3 API" });

    await interaction.editReply({
      content: `✅ Converted: ${data.title}`,
      embeds: [embed],   // must be array
      files: [tempFile]  // only works if not ephemeral
    });

    fs.unlinkSync(tempFile); // cleanup
  } catch (err) {
    console.error("Convert command error:", err);
    await interaction.editReply(`❌ Error: ${err.message}`);
  }
}
