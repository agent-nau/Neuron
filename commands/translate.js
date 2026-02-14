import { SlashCommandBuilder } from "discord.js";
import fetch from "node-fetch";

export const data = new SlashCommandBuilder()
  .setName("translate")
  .setDescription("Translate text using Datpmt Dictionary API")
  .addStringOption(option =>
    option.setName("text")
      .setDescription("The text to translate")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("source")
      .setDescription("Source language code (e.g., en)")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("target")
      .setDescription("Target language code (e.g., es, fr, de)")
      .setRequired(true)
  );

export async function execute(interaction) {
  const text = interaction.options.getString("text");
  const source = interaction.options.getString("source");
  const target = interaction.options.getString("target");

  await interaction.deferReply({ flags: 64 });

  try {
    const url = `https://api.datpmt.com/api/v1/dictionary/translate?text=${encodeURIComponent(text)}&source=${source}&target=${target}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();

    const translated = data.translatedText || data.result || JSON.stringify(data);

    await interaction.editReply(`✅ Translation: ${translated}`);
  } catch (error) {
    console.error("❌ Translation error:", error);
    await interaction.editReply("❌ Translation service is currently unavailable. Please try again later.");
  }
}
