import { SlashCommandBuilder } from "discord.js";
import fetch from "node-fetch";

export const data = new SlashCommandBuilder()
  .setName("translate")
  .setDescription("Translate text using Argos Translate")
  .addStringOption(option =>
    option.setName("text")
      .setDescription("The text to translate")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("target")
      .setDescription("Target language code (e.g., es, fr, de)")
      .setRequired(true)
  );

export async function execute(interaction) {
  const text = interaction.options.getString("text");
  const target = interaction.options.getString("target");

  try {
    const response = await fetch("https://translate.argosopentech.com/translate", {
      method: "POST",
      body: JSON.stringify({ q: text, source: "en", target }),
      headers: { "Content-Type": "application/json" }
    });

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    await interaction.reply({
      content: `✅ Translation: ${data.translatedText}`,
      flags: 64   // replaces deprecated ephemeral:true
    });
  } catch (error) {
    console.error("❌ Translation error:", error);
    await interaction.reply({
      content: "❌ Translation service is currently unavailable. Please try again later.",
      flags: 64 
    });
  }
}
