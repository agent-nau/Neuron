import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { scheduledGreetings } from "./birthday.js";

const data = new SlashCommandBuilder()
    .setName("birthday-list")
    .setDescription("Show all scheduled birthday greetings with dates");

async function execute(interaction) {
    if (scheduledGreetings.length === 0) {
        return interaction.reply("📭 No birthday greetings scheduled.");
    }

    const embed = new EmbedBuilder()
        .setColor(0x87CEEB)
        .setTitle("📅 Scheduled Birthday Greetings")
        .setDescription(
            scheduledGreetings
                .map(
                    (g, i) =>
                        `**${i + 1}.** For **${g.user}** → \`${g.cronExpr}\`\nMessage: ${g.message}`
                )
                .join("\n\n")
        )
        .setFooter({ text: "All scheduled greetings" })
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

export { data, execute };
export default { data, execute };