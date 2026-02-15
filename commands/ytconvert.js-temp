import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import fetch from "node-fetch";

export const category = "Utility";

export const data = new SlashCommandBuilder()
  .setName("ytmp3")
  .setDescription("Convert a YouTube video to MP3 or other formats")
  .addStringOption(opt =>
    opt.setName("url")
      .setDescription("YouTube video URL")
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName("format")
      .setDescription("Format: mp3, videos, or mp3-mp4 (default mp3)")
      .setRequired(false)
  );

export async function execute(interaction) {
  const url = interaction.options.getString("url");
  const format = interaction.options.getString("format") || "mp3";

  await interaction.deferReply();

  try {
    const res = await fetch(`https://www.yt2mp3.cloud/apis/yt2mp3.php?url=${encodeURIComponent(url)}&format=${format}`);
    if (!res.ok) throw new Error(`API error: ${res.statusText}`);

    const data = await res.json();

    if (data.status !== "ok" || !data.link) {
      throw new Error(data.msg || "Conversion failed");
    }

    // Build embed
    const embed = new EmbedBuilder()
      .setTitle(data.title || "YouTube Conversion")
      .setDescription(`**Format:** ${format}\n**Length:** ${data.length || "N/A"}`)
      .setColor(0xff0000)
      .setThumbnail(data.thumbnail || "https://www.youtube.com/s/desktop/fe2f1e4e/img/favicon_144.png")
      .setFooter({ text: "Powered by yt2mp3.cloud" });

    // Buttons
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Download")
        .setStyle(ButtonStyle.Link)
        .setURL(data.link),
      new ButtonBuilder()
        .setLabel("YouTube Video")
        .setStyle(ButtonStyle.Link)
        .setURL(url)
    );

    await interaction.editReply({ embeds: [embed], components: [row] });
  } catch (err) {
    console.error(err);
    await interaction.editReply(`❌ Error: ${err.message}`);
  }
}
