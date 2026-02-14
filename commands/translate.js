import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import fetch from "node-fetch";

export const category = "Utility";

export const data = new SlashCommandBuilder()
  .setName("translate")
  .setDescription("Translate text or a message by ID into another language")
  .addStringOption(option =>
    option.setName("text")
      .setDescription("Text to translate OR a message ID")
      .setRequired(true)
  )
  .addStringOption(option =>
    option.setName("to")
      .setDescription("Target language (e.g., en, es, fr, ja)")
      .setRequired(true)
  );

export async function execute(interaction) {
  const input = interaction.options.getString("text");
  const targetLang = interaction.options.getString("to");

  let textToTranslate = input;

  if (/^\d{17,20}$/.test(input)) {
    try {
      const targetMsg = await interaction.channel.messages.fetch(input);
      if (targetMsg) {
        textToTranslate = targetMsg.content;
      }
    } catch (err) {
      return interaction.reply({
        content: "❌ Could not fetch that message ID.",
        ephemeral: true,
      });
    }
  }

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

    await interaction.reply({ embeds: [embed], ephemeral: false });
  } catch (err) {
    console.error(err);
    await interaction.reply({
      content: "❌ Sorry, I couldn’t translate that right now.",
      ephemeral: true,
    });
  }
}