import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } from 'discord.js';

export const category = "Utility";

async function fetchMeme() {
  const url = 'https://reddit-meme.p.rapidapi.com/memes/trending';
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': 'f391b6ae8bmsh30d518346caa257p12f928jsn342a0a39b90e',
      'x-rapidapi-host': 'reddit-meme.p.rapidapi.com'
    }
  };

  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.json();
  const memes = Array.isArray(data) ? data : (data.memes || []);
  if (memes.length === 0) throw new Error('No memes found');
  return memes[Math.floor(Math.random() * memes.length)];
}

export const data = new SlashCommandBuilder()
  .setName('meme')
  .setDescription('Get a random trending meme from Reddit');

export async function execute(interaction) {
  // Acknowledge immediately to prevent 10062 errors
  await interaction.deferReply();

  const meme = await fetchMeme();
  
  const embed = new EmbedBuilder()
    .setTitle(meme.title?.substring(0, 255) || 'Meme')
    .setURL(meme.post_link || 'https://reddit.com')
    .setImage(meme.url)
    .setColor(0xFF4500)
    .setFooter({ text: `r/${meme.subreddit || 'memes'} | Trending` })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('meme_next')
      .setLabel('🎲 Next Meme')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setURL(meme.post_link || 'https://reddit.com')
      .setLabel('View on Reddit')
      .setStyle(ButtonStyle.Link)
  );

  await interaction.editReply({ embeds: [embed], components: [row] });
}

export async function handleInteraction(interaction) {
  if (interaction.isButton() && interaction.customId === 'meme_next') {
    try {
      try {
        await interaction.deferUpdate();
      } catch (deferErr) {
        if (deferErr.code === 10062 || deferErr.code === 40060) return;
        throw deferErr;
      }

      const meme = await fetchMeme();

      const embed = new EmbedBuilder()
        .setTitle(meme.title?.substring(0, 255) || 'Meme')
        .setURL(meme.post_link || 'https://reddit.com')
        .setImage(meme.url)
        .setColor(0xFF4500)
        .setFooter({ text: `r/${meme.subreddit || 'memes'} | Trending` })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('meme_next')
          .setLabel('🎲 Next Meme')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setURL(meme.post_link || 'https://reddit.com')
          .setLabel('View on Reddit')
          .setStyle(ButtonStyle.Link)
      );

      await interaction.editReply({ embeds: [embed], components: [row] });
    } catch (err) {
      console.error(`Meme button error:`, err);
      // Quietly fail if interaction is too old
      if (err.code !== 10062 && err.code !== 40060) {
        try {
          await interaction.followUp({ content: '❌ Outdated interaction, please use /meme again.', flags: MessageFlags.Ephemeral });
        } catch {}
      }
    }
  }
}
