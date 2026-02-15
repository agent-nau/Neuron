import { SlashCommandBuilder } from "discord.js";
import fetch from "node-fetch";

export const data = new SlashCommandBuilder()
  .setName("translate")
  .setDescription("Translate text using MyMemory API")
  .addStringOption(option =>
    option.setName("text")
      .setDescription("The text to translate")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("source")
      .setDescription("Source language code (e.g., en, fr, es)")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("target")
      .setDescription("Target language code (e.g., en, fr, es)")
      .setRequired(true)
  );

export async function execute(interaction) {
  const text = interaction.options.getString("text");
  const source = interaction.options.getString("source");
  const target = interaction.options.getString("target");

  await interaction.deferReply({ flags: 64 });

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${source}|${target}`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    const translated = data.responseData.translatedText;

    await interaction.editReply(`✅ Translation: ${translated}`);
  } catch (error) {
    console.error("❌ Translation error:", error);
    await interaction.editReply("❌ Translation service is currently unavailable. Please try again later.");
  }
}
