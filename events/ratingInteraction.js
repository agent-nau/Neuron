import { RatingManager } from '../managers/RatingManager.js';

export const name = 'interactionCreate';
export const once = false;

export async function execute(interaction, context) {
    const manager = new RatingManager(interaction.client);
    
    // Handle "Rate Bot" button click
    if (interaction.isButton() && interaction.customId === 'open_rating_modal') {
        try {
            await interaction.showModal(manager.createRatingModal());
        } catch (error) {
            console.error('Error showing modal:', error);
        }
    }
    
    // Handle rating submission
    if (interaction.isModalSubmit() && interaction.customId === 'submit_rating') {
        try {
            await manager.handleRatingSubmit(interaction);
        } catch (error) {
            console.error('Error handling rating submit:', error);
            await interaction.reply({
                content: '❌ Something went wrong. Please try again.',
                ephemeral: true
            }).catch(() => {});
        }
    }
}