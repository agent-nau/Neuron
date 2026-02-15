import { SlashCommandBuilder } from "discord.js";
import fetch from "node-fetch";

export const category = "Utility";

async function translateLingva(text, target) {
  const res = await fetch(`https://lingva.ml/api/v1/auto/${target}/${encodeURIComponent(text)}`);
  if (!res.ok) throw new Error(`Lingva API error: ${res.statusText}`);
  const data = await res.json();
  return { translation: data.translation, detected: data.info.detectedSource };
}

export const data = new SlashCommandBuilder()
  .setName("translate")
  .setDescription("Translate text using Lingva (auto-detect source)")
  .addStringOption(opt =>
    opt.setName("text").setDescription("Text to translate").setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName("to").setDescription("Target language code (e.g. en)").setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName("reply").setDescription("Message ID or message link to reply to").setRequired(false)
  );

export async function execute(interaction) {
  const text = interaction.options.getString("text");
  const to = interaction.options.getString("to");
  const messageRef = interaction.options.getString("reply");

  try {
    const { translation, detected } = await translateLingva(text, to);

    if (messageRef) {
      let messageId;

      if (messageRef.startsWith("https://")) {
        const parts = messageRef.split("/");
        messageId = parts[parts.length - 1];
      } else {
        messageId = messageRef;
      }

      const channel = interaction.channel;
      const targetMessage = await channel.messages.fetch(messageId);

      await targetMessage.reply(`**${detected} → ${to}:** ${translation}`);
      await interaction.reply({ content: "✅ Translation posted as a reply!", ephemeral: true });
    } else {
      await interaction.reply(`**${detected} → ${to}:** ${translation}`);
    }
  } catch (err) {
    await interaction.reply(`❌ Error: ${err.message}`);
  }
}
