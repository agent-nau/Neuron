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
    const response = await fetch("https://api.datpmt.com/api/v1/dictionary/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,      
        source,     
        target      
      })
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    // Assuming API returns { translatedText: "..." }
    await interaction.editReply(`✅ Translation: ${data.translatedText}`);
  } catch (error) {
    console.error("❌ Translation error:", error);
    await interaction.editReply("❌ Translation service is currently unavailable. Please try again later.");
  }
}
