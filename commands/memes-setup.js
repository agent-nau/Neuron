import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, MessageFlags } from 'discord.js';

export const category = "Utility";
const DEFAULT_SUBREDDIT = "memes";

// Shared function to fetch and build the meme response
async function fetchMeme() {
  try {
    const response = await fetch(`https://www.reddit.com/r/${DEFAULT_SUBREDDIT}/hot.json?limit=50`, {
      headers: { 'User-Agent': 'DiscordBot/1.0' }
    });
    
    if (!response.ok) throw new Error('Failed to fetch from Reddit');
    
    const data = await response.json();
    const posts = data.data.children.filter(post => 
      !post.data.is_self && 
      !post.data.stickied &&
      (post.data.url.endsWith('.jpg') || 
       post.data.url.endsWith('.jpeg') ||
       post.data.url.endsWith('.png') || 
       post.data.url.endsWith('.gif') ||
       post.data.url.includes('i.redd.it') ||
       post.data.url.includes('i.imgur'))
    );

    if (posts.length === 0) return { content: '❌ No image posts found!', embeds: [], components: [] };

    const randomPost = posts[Math.floor(Math.random() * posts.length)].data;
    
    const embed = new EmbedBuilder()
      .setTitle(randomPost.title.substring(0, 256))
      .setURL(`https://reddit.com${randomPost.permalink}`)
      .setImage(randomPost.url)
      .setColor(0xFF5700)
      .setFooter({ 
        text: `👍 ${randomPost.ups} | 💬 ${randomPost.num_comments} | u/${randomPost.author}`
      })
      .setTimestamp(new Date(randomPost.created_utc * 1000));

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('next_meme')
          .setLabel('🎲 Next Meme')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setURL(`https://reddit.com${randomPost.permalink}`)
          .setLabel('View on Reddit')
          .setStyle(ButtonStyle.Link)
      );

    return { embeds: [embed], components: [row] };

  } catch (error) {
    console.error(error);
    return { content: '❌ Failed to fetch meme! (Reddit API might be down)', embeds: [], components: [] };
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