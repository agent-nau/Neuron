import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import fetch from "node-fetch";

export const category = "Utility";

export const data = new SlashCommandBuilder()
  .setName("translate")
  .setDescription("Translate text into another language")
  .addStringOption(option =>
    option.setName("text")
      .setDescription("Text to translate")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("to")
      .setDescription("Target language (e.g., en, es, fr, ja)")
      .setRequired(true)
  );

export async function execute(interaction) {
  const text = interaction.options.getString("text");
  const targetLang = interaction.options.getString("to");

  try {
    const res = await fetch("https://translate.argosopentech.com/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "auto",
        target: targetLang,
        format: "text"
      })
    });

    const data = await res.json();

    const embed = new EmbedBuilder()
      .setTitle("🌐 Translation")
      .addFields(
        { name: "Original", value: text },
        { name: `Translated (${targetLang})`, value: data.translatedText }
      )
      .setColor(0x00bfff);

    await interaction.reply({ embeds: [embed], ephemeral: false });
  } catch (err) {
    console.error(err);
    await interaction.reply({
      content: "❌ Sorry, I couldn’t translate that right now.",
      ephemeral: true
    });
  }
}