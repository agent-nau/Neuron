import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { scheduledGreetings } from "./birthday.js";

const data = new SlashCommandBuilder()
    .setName("birthday-list")
    .setDescription("Show all scheduled birthday greetings with IDs");

async function execute(interaction) {
    if (scheduledGreetings.length === 0) {
        try {
            await interaction.user.send("📭 No birthday greetings scheduled.");
            return interaction.reply({ content: "📬 Check your DMs!", ephemeral: false });
        } catch {
            return interaction.reply({ content: "📭 No birthday greetings scheduled.", ephemeral: true });
        }
    }

    const sorted = [...scheduledGreetings].sort((a, b) => a.id - b.id);
    const userId = interaction.user.id;

    const embed = new EmbedBuilder()
        .setColor(0x87CEEB)
        .setTitle("📅 Scheduled Birthday Greetings")
        .setDescription(
            sorted.map(g => {
                const yearText = g.year ? `/${g.year}` : "";
                const isYours = g.requester === userId;
                const ownerTag = isYours ? "✅ **Yours**" : `❌ ${g.requesterName}`;
                const canDelete = isYours ? `\n├ Use: \`/birthday-delete id:${g.id}\`` : "";
                
                return `**#${g.id}** ${ownerTag}\n` +
                       `├ For: **${g.user}**\n` +
                       `├ Date: \`${g.day}/${g.month}${yearText}\`\n` +
                       `└ Channel: <#${g.channelId}>${canDelete}`;
            }).join("\n\n")
        )
        .setFooter({ 
            text: `Total: ${scheduledGreetings.length} | ✅ You can delete your own` 
        })
        .setTimestamp();

    try {
        await interaction.user.send({ embeds: [embed] });
        await interaction.reply({ content: "📬 Check your DMs for the list!", ephemeral: false });
    } catch (error) {
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
}

export { data, execute };
export default { data, execute };