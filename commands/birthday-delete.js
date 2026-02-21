import { SlashCommandBuilder } from "discord.js";
import { scheduledGreetings } from "./birthday.js";

export const category = "Utility";

const data = new SlashCommandBuilder()
    .setName("birthday-delete")
    .setDescription("Delete a scheduled birthday greeting you created")
    .addIntegerOption(option =>
        option.setName("id")
            .setDescription("The greet ID to delete (from /birthday-list)")
            .setRequired(true)
            .setMinValue(1));

async function execute(interaction) {
    const greetId = interaction.options.getInteger("id");
    
    const index = scheduledGreetings.findIndex(g => g.id === greetId);
    
    if (index === -1) {
        try {
            await interaction.user.send(`❌ Greeting #${greetId} not found. Use \`/birthday-list\` to see valid IDs.`);
            return interaction.reply({ content: "📬 Check your DMs!", ephemeral: true });
        } catch {
            return interaction.reply({
                content: `❌ Greeting #${greetId} not found.`,
                ephemeral: true
            });
        }
    }

    const greeting = scheduledGreetings[index];
    const isCreator = greeting.requester === interaction.user.id;

    // STRICT: Only creator can delete
    if (!isCreator) {
        try {
            await interaction.user.send(
                `❌ **You cannot delete this greeting!**\n\n` +
                `🆔 Greeting #${greetId} was created by **${greeting.requesterName}**.\n` +
                `👤 You can only delete greetings that **you** created.\n\n` +
                `Ask ${greeting.requesterName} to delete it, or contact a server admin.`
            );
            return interaction.reply({ content: "📬 Check your DMs!", ephemeral: false });
        } catch {
            return interaction.reply({
                content: `❌ You can only delete greetings you created. This was created by ${greeting.requesterName}.`,
                ephemeral: true
            });
        }
    }

    // Stop the cron job
    if (greeting.task) {
        greeting.task.stop();
    }

    // Remove from array
    scheduledGreetings.splice(index, 1);

    const dmMessage = `✅ **Greeting #${greetId} deleted successfully!**\n\n` +
                     `👤 Was for: ${greeting.user}\n` +
                     `📅 Date: ${greeting.day}/${greeting.month}${greeting.year ? '/' + greeting.year : ''}`;

    try {
        await interaction.user.send(dmMessage);
        await interaction.reply({ content: "✅ Deleted! Check your DMs for confirmation.", ephemeral: false });
    } catch {
        await interaction.reply({ content: dmMessage, ephemeral: true });
    }
}

export { data, execute };
export default { data, execute };