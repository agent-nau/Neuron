import { 
    EmbedBuilder, 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';
import { 
    loadRatings, 
    saveRatings, 
    calculateAverage, 
    getRatingsChannel 
} from './ratingData.js';

export class RatingManager {
    constructor(client) {
        this.client = client;
    }

    // Send the main rating panel embed
    async sendRatingPanel(channel) {
        const data = await loadRatings();
        
        const embed = new EmbedBuilder()
            .setColor(0x5865F2) // Discord blurple
            .setTitle('⭐ Rate Neuron')
            .setDescription('Click **Rate Bot** below to submit your anonymous review.\n\nYour feedback helps us improve!')
            .setFooter({ 
                text: `⭐ ${data.average_rating.toFixed(1)} · ${data.total_reviews} reviews`, 
                iconURL: this.client.user.displayAvatarURL() 
            });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('open_rating_modal')
                    .setLabel('Rate Bot')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('⭐')
            );

        await channel.send({ embeds: [embed], components: [row] });
    }

    // Create the rating modal popup
    createRatingModal() {
        const modal = new ModalBuilder()
            .setCustomId('submit_rating')
            .setTitle('Rate Neuron');

        const starInput = new TextInputBuilder()
            .setCustomId('star_rating')
            .setLabel('Stars (1-5)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Enter a number: 1, 2, 3, 4, or 5')
            .setRequired(true)
            .setMaxLength(1);

        const commentInput = new TextInputBuilder()
            .setCustomId('rating_comment')
            .setLabel('Comment (Optional)')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('What did you like? What can we improve?')
            .setRequired(false)
            .setMaxLength(1000);

        modal.addComponents(
            new ActionRowBuilder().addComponents(starInput),
            new ActionRowBuilder().addComponents(commentInput)
        );

        return modal;
    }

    // Handle when user submits the modal
    async handleRatingSubmit(interaction) {
        const starsInput = interaction.fields.getTextInputValue('star_rating');
        const stars = parseInt(starsInput);
        const comment = interaction.fields.getTextInputValue('rating_comment') || null;

        // Validate input
        if (isNaN(stars) || stars < 1 || stars > 5) {
            return await interaction.reply({
                content: '❌ Please enter a valid number between 1 and 5.',
                ephemeral: true
            });
        }

        // Load and update data
        const data = await loadRatings();
        
        // Remove previous rating from this user (one rating per user)
        const existingIndex = data.ratings.findIndex(r => r.userId === interaction.user.id);
        const isUpdate = existingIndex !== -1;
        
        if (isUpdate) {
            data.ratings.splice(existingIndex, 1);
        }

        // Add new rating
        data.ratings.push({
            userId: interaction.user.id,
            stars: stars,
            comment: comment,
            timestamp: new Date().toISOString()
        });

        // Recalculate stats
        data.total_reviews = data.ratings.length;
        data.average_rating = calculateAverage(data.ratings);
        
        await saveRatings(data);

        // Log to channel
        await this.logRating(interaction.guild, stars, comment, data.average_rating, isUpdate);

        // Update bot presence
        await this.updateBotPresence(data);

        // Reply to user
        await interaction.reply({
            content: `✅ ${isUpdate ? 'Updated' : 'Thanks for your'} ${'⭐'.repeat(stars)} rating!`,
            ephemeral: true
        });
    }

    // Send anonymous rating to log channel
    async logRating(guild, stars, comment, currentAvg, isUpdate = false) {
        const channelId = await getRatingsChannel(guild.id);
        const logChannel = channelId ? guild.channels.cache.get(channelId) : null;
        
        if (!logChannel) return;

        const embed = new EmbedBuilder()
            .setColor(this.getRatingColor(stars))
            .setTitle(`🎫 ${isUpdate ? 'Updated' : 'New'} Anonymous Rating`)
            .addFields(
                { 
                    name: 'Rating Given', 
                    value: `${'⭐'.repeat(stars)} (${stars}/5)`, 
                    inline: true 
                },
                { 
                    name: 'New Average', 
                    value: `⭐ ${currentAvg.toFixed(1)}`, 
                    inline: true 
                }
            )
            .setTimestamp();

        if (comment) {
            embed.addFields({ 
                name: 'Anonymous Comment', 
                value: `> ${comment.substring(0, 1000)}` 
            });
        }

        await logChannel.send({ embeds: [embed] });
    }

    // Get color based on rating
    getRatingColor(stars) {
        if (stars === 5) return 0x57F287; // Green
        if (stars === 4) return 0x5865F2; // Blurple
        if (stars === 3) return 0xFEE75C; // Yellow
        if (stars === 2) return 0xE67E22; // Orange
        return 0xED4245; // Red
    }

    // Update bot's activity status
    async updateBotPresence(data) {
        try {
            await this.client.user.setActivity(
                `⭐ ${data.average_rating.toFixed(1)}/5.0 · ${data.total_reviews} ratings`,
                { type: 3 } // Watching
            );
        } catch (error) {
            console.error('Failed to update presence:', error);
        }
    }
}