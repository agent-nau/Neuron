import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } from 'discord.js';

export const category = "Utility";
const DEFAULT_SUBREDDIT = "memes";

// Shared function to fetch and build the meme response
async function fetchMeme() {
  const url = 'https://reddit-meme.p.rapidapi.com/memes/trending';
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': 'f391b6ae8bmsh30d518346caa257p12f928jsn342a0a39b90e',
      'x-rapidapi-host': 'reddit-meme.p.rapidapi.com'
    }
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    // API might return an array or an object with a 'memes' property
    const data = await response.json();
    const memes = Array.isArray(data) ? data : (data.memes || []);
    
    if (memes.length === 0) {
      return { content: '❌ No memes found in the trending list!', embeds: [], components: [] };
    }

    const randomMeme = memes[Math.floor(Math.random() * memes.length)];
    
    // Fallback values for common fields
    const title = randomMeme.title?.substring(0, 256) || 'Untitled Meme';
    const memeUrl = randomMeme.url;
    const postLink = randomMeme.post_link || '#';
    const subreddit = randomMeme.subreddit || 'memes';

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setURL(postLink)
      .setImage(memeUrl)
      .setColor(0xFF5700)
      .setFooter({ 
        text: `r/${subreddit} | Powered by RapidAPI`
      })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('next_meme')
          .setLabel('🎲 Next Meme')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setURL(postLink.startsWith('http') ? postLink : 'https://reddit.com')
          .setLabel('View on Reddit')
          .setStyle(ButtonStyle.Link)
      );

    return { embeds: [embed], components: [row] };

  } catch (error) {
    console.error('RapidAPI Meme Error:', error);
    return { content: `❌ Failed to fetch meme from RapidAPI: ${error.message}`, embeds: [], components: [] };
  }
}

export const data = new SlashCommandBuilder()
  .setName('meme-setup')
  .setDescription('Post a persistent meme panel in a channel')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addChannelOption(o => o.setName('channel').setDescription('Channel to post the panel').setRequired(true));

export async function execute(interaction) {
  const channel = interaction.options.getChannel('channel');
  
  const setupEmbed = new EmbedBuilder()
    .setTitle('🎭 Meme Channel')
    .setDescription('Click the button below to get a fresh meme from Reddit!')
    .setColor(0xFF5700);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('next_meme')
      .setLabel('🎲 Get a Meme')
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [setupEmbed], components: [row] });
  await interaction.reply({ content: `✅ Meme channel setup in ${channel}`, flags: MessageFlags.Ephemeral });
}

// Handle global interactions for buttons
export async function handleInteraction(interaction) {
  if (interaction.isButton() && interaction.customId === 'next_meme') {
    await interaction.deferUpdate();
    const memeData = await fetchMeme();
    await interaction.editReply(memeData);
  }
}