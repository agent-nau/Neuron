import { SlashCommandBuilder } from "discord.js";
import fetch from "node-fetch";

export const category = "Utility";

export const data = new SlashCommandBuilder()
  .setName("ytmp3")
  .setDescription("Convert a YouTube video to MP3")
  .addStringOption(opt =>
    opt.setName("url")
      .setDescription("YouTube video URL")
      .setRequired(true)
  );

export async function execute(interaction) {
  const url = interaction.options.getString("url");

  await interaction.deferReply(); // give time for API call

  try {
    // Call yt2mp3 API
    const res = await fetch(`https://www.yt2mp3.cloud/apis/yt2mp3.php?url=${encodeURIComponent(url)}`);
    if (!res.ok) throw new Error(`API error: ${res.statusText}`);

    const data = await res.json();

    if (data.status !== "ok" || !data.link) {
      throw new Error(data.msg || "Conversion failed");
    }

    await interaction.editReply(`✅ Converted successfully!\n**Title:** ${data.title}\n[Download MP3](${data.link})`);
  } catch (err) {
    console.error(err);
    await interaction.editReply(`❌ Error: ${err.message}`);
  }
}
