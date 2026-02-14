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
  )
  .addStringOption(option =>
    option.setName("message_id")
      .setDescription("Optional: reply to a specific message ID")
      .setRequired(false)
  );

export async function execute(interaction) {
  const text = interaction.options.getString("text");
  const targetLang = interaction.options.getString("to");
  const messageId = interaction.options.getString("message_id");

  let textToTranslate = text;

  try {
    const res = await fetch("https://translate.argosopentech.com/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: textToTranslate,
        source: "auto",
        target: targetLang,
        format: "text",
      }),
    });

    const data = await res.json();

    const embed = new EmbedBuilder()
      .setTitle("🌐 Translation")
      .addFields(
        { name: "Original", value: textToTranslate },
        { name: `Translated (${targetLang})`, value: data.translatedText }
      )
      .setColor(0x00bfff);

    if (messageId) {
      try {
        const targetMsg = await interaction.channel.messages.fetch(messageId);
        await targetMsg.reply({ embeds: [embed] });
        await interaction.reply({ content: "✅ Translation sent as a reply!", ephemeral: true });
      } catch (err) {
        await interaction.reply({ content: "❌ Could not fetch that message ID.", ephemeral: true });
      }
    } else {
      await interaction.reply({ embeds: [embed], ephemeral: false });
    }
  } catch (err) {
    console.error(err);
    await interaction.reply({
      content: "❌ Sorry, I couldn’t translate that right now.",
      ephemeral: true,
    });
  }
}