import { SlashCommandBuilder } from "discord.js";
import { scheduledGreetings } from "./birthday.js";

export const category = "Utility";

const data = new SlashCommandBuilder()
    .setName("birthday-delete")
    .setDescription("Delete a scheduled birthday greeting you created")
    .addIntegerOption(option =>
        option.setName("id")
            .setDescription("The greet ID to delete")
            .setRequired(true)
            .setMinValue(1));

async function execute(interaction) {
    const greetId = interaction.options.getInteger("id");
    const index = scheduledGreetings.findIndex(g => g.id === greetId);
    
    if (index === -1) {
        try {
            await interaction.user.send(`❌ Greeting #${greetId} not found.`);
            return interaction.reply({ content: "📬 Check your DMs!", ephemeral: true });
        } catch {
            return interaction.reply({ content: `❌ Greeting #${greetId} not found.`, ephemeral: true });
        }
    }

    const greeting = scheduledGreetings[index];
    
    if (greeting.requester !== interaction.user.id) {
        try {
            await interaction.user.send(`❌ You can only delete your own greetings.`);
            return interaction.reply({ content: "📬 Check your DMs!", ephemeral: true });
        } catch {
            return interaction.reply({ content: `❌ You can only delete your own greetings.`, ephemeral: true });
        }
    }

    // Cancel the timeout (one-time schedule)
    if (greeting.timeoutId) {
        clearTimeout(greeting.timeoutId);
    }

    scheduledGreetings.splice(index, 1);

    const dmMessage = `✅ **Greeting #${greetId} deleted!**\n\n👤 Was for: ${greeting.user}\n📅 ${greeting.dateString} at ${greeting.timeString}`;

    try {
        await interaction.user.send(dmMessage);
        await interaction.reply({ content: "✅ Deleted! Check your DMs!", ephemeral: true });
    } catch {
        await interaction.reply({ content: dmMessage, ephemeral: true });
    }
}

export { data, execute };
export default { data, execute };