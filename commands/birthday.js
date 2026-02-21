import { SlashCommandBuilder } from "discord.js";
import { scheduledGreetings } from "./birthday.js";

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
            await interaction.user.send(`❌ Greeting #${greetId} not found.`);
            return interaction.reply({ content: "📬 Check your DMs!", ephemeral: false });
        } catch {
            return interaction.reply({
                content: `❌ Greeting #${greetId} not found.`,
                ephemeral: true
            });
        }
    }

    const greeting = scheduledGreetings[index];
    const isCreator = greeting.requester === interaction.user.id;

    if (!isCreator) {
        try {
            await interaction.user.send(
                `❌ **You cannot delete this greeting!**\n\n🆔 Greeting #${greetId} was created by **${greeting.requesterName}**.`
            );
            return interaction.reply({ content: "📬 Check your DMs!", ephemeral: false });
        } catch {
            return interaction.reply({
                content: `❌ You can only delete greetings you created.`,
                ephemeral: true
            });
        }
    }

    if (greeting.task) {
        greeting.task.stop();
    }

    scheduledGreetings.splice(index, 1);

    const dmMessage = `✅ **Greeting #${greetId} deleted!**\n\n👤 Was for: ${greeting.user}\n📅 ${greeting.day}/${greeting.month} at ${greeting.timeString}`;

    try {
        await interaction.user.send(dmMessage);
        await interaction.reply({ content: "✅ Deleted! Check your DMs!", ephemeral: false });
    } catch {
        await interaction.reply({ content: dmMessage, ephemeral: true });
    }
}

export { data, execute };
export default { data, execute };