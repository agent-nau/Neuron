import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, PermissionFlagsBits } from 'discord.js';

export const category = "Utility";
const DEFAULT_SUBREDDIT = "memes";

export const data = new SlashCommandBuilder()
  .setName('meme')
  .setDescription('Get a random meme from r/memes (Admin only)')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction) {
  await interaction.deferReply();

  const sendMeme = async () => {
    try {
      const response = await fetch(`https://www.reddit.com/r/${DEFAULT_SUBREDDIT}/hot.json?limit=50`, {
        headers: { 'User-Agent': 'DiscordBot/1.0' }
      });
      
      if (!response.ok) throw new Error('Failed to fetch');
      
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

      if (posts.length === 0) {
        return interaction.editReply({ 
          content: '❌ No image posts found!', 
          embeds: [], 
          components: [] 
        });
      }

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

      await interaction.editReply({ embeds: [embed], components: [row] });

    } catch (error) {
      console.error(error);
      await interaction.editReply({ 
        content: '❌ Failed to fetch meme!', 
        embeds: [], 
        components: [] 
      });
    }
  };

  await sendMeme();

  const message = await interaction.fetchReply();
  
  const collector = message.createMessageComponentCollector({ 
    componentType: ComponentType.Button, 
    time: 300000 
  });

  collector.on('collect', async (i) => {
    if (i.customId === 'next_meme') {
      // Check admin permission on button click too
      if (!i.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return i.reply({ 
          content: '❌ Admin only!', 
          ephemeral: true 
        });
      }

      await i.deferUpdate();
      await sendMeme();
    }
  });

  collector.on('end', () => {
    const disabledRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('next_meme')
          .setLabel('⏰ Expired')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setURL(`https://reddit.com/r/${DEFAULT_SUBREDDIT}`)
          .setLabel('Browse r/' + DEFAULT_SUBREDDIT)
          .setStyle(ButtonStyle.Link)
      );
    
    interaction.editReply({ components: [disabledRow] }).catch(() => {});
  });
}