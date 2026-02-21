import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import cron from "node-cron";

export const scheduledGreetings = [];
let nextGreetId = 1;

function generateBirthdayMessage(name = "friend") {
    const adjectives = ["wonderful", "amazing", "fantastic", "incredible", "joyful", "magical"];
    const wishes = [
        "May your day be filled with laughter, love, and unforgettable memories.",
        "Wishing you endless happiness and success in the year ahead.",
        "May this birthday mark the beginning of your best chapter yet.",
        "Celebrate big today and enjoy every single moment — you've earned it!",
        "May your heart be full of joy and your life full of adventure."
    ];
    const emojis = ["🎂", "🎉", "🍰", "🌟", "💖", "🥳"];

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const wish = wishes[Math.floor(Math.random() * wishes.length)];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    return `${emoji} Happy Birthday, ${name}! You are such a ${adj} person. ${wish}`;
}

function getCronExpression(day, month) {
    return `0 9 ${day} ${month} *`;
}

const data = new SlashCommandBuilder()
    .setName("birthday")
    .setDescription("Schedule a birthday greeting")
    .addIntegerOption(option =>
        option.setName("day")
            .setDescription("Day of birthday (1-31)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(31))
    .addIntegerOption(option =>
        option.setName("month")
            .setDescription("Month of birthday (1-12)")
            .setRequired(true)
            .setMinValue(1)
            .setMaxValue(12))
    .addIntegerOption(option =>
        option.setName("year")
            .setDescription("Year of birthday (optional, schedules annually if not set)")
            .setRequired(false)
            .setMinValue(2024)
            .setMaxValue(2100))
    .addUserOption(option =>
        option.setName("user")
            .setDescription("The user to greet (defaults to yourself)")
            .setRequired(false));

async function execute(interaction) {
    const targetUser = interaction.options.getUser("user");
    const name = targetUser ? targetUser.username : interaction.user.username;
    const day = interaction.options.getInteger("day");
    const month = interaction.options.getInteger("month");
    const year = interaction.options.getInteger("year");

    // Validate date
    const testYear = year || new Date().getFullYear();
    const date = new Date(testYear, month - 1, day);
    if (date.getDate() !== day || date.getMonth() !== month - 1) {
        return interaction.reply({
            content: "❌ Invalid date! Please check the day and month.",
            ephemeral: true
        });
    }

    const cronExpr = getCronExpression(day, month);
    const message = generateBirthdayMessage(name);
    const greetId = nextGreetId++;

    const thumbnailUrl = targetUser
        ? targetUser.displayAvatarURL({ extension: "png", size: 256 })
        : interaction.user.displayAvatarURL({ extension: "png", size: 256 });

    const embed = new EmbedBuilder()
        .setColor(0xFFC0CB)
        .setTitle("🎂 Birthday Greeting 🎂")
        .setDescription(message)
        .setThumbnail(thumbnailUrl)
        .setFooter({ text: `Greet ID: #${greetId}` })
        .setTimestamp();

    const yearText = year ? ` ${year}` : "";
    const scheduleType = year ? "once" : "annually";

    const task = cron.schedule(cronExpr, async () => {
        const channel = await interaction.client.channels.fetch(interaction.channelId);
        if (channel) {
            channel.send({ embeds: [embed] });
        }
    }, { scheduled: true });

    const greeting = {
        id: greetId,
        user: name,
        targetUserId: targetUser?.id || interaction.user.id,
        message,
        day,
        month,
        year,
        cronExpr,
        channelId: interaction.channelId,
        requester: interaction.user.id,
        requesterName: interaction.user.username,
        createdAt: new Date().toISOString(),
        task
    };

    scheduledGreetings.push(greeting);

    // DM the confirmation to user
    const dmMessage = `✅ **Birthday greeting created!**\n\n` +
                     `🆔 **ID:** #${greetId}\n` +
                     `👤 **For:** ${name}\n` +
                     `📅 **Date:** ${day}/${month}${yearText}\n` +
                     `⏰ **Time:** 9:00 AM\n` +
                     `🔄 **Schedule:** ${scheduleType}\n\n` +
                     `Use \`/birthday-list\` to view all greetings.\n` +
                     `Use \`/birthday-delete id:${greetId}\` to remove this greeting.`;

    try {
        await interaction.user.send(dmMessage);
        
        // Public confirmation (without details)
        await interaction.reply({
            content: `✅ Birthday greeting scheduled! Check your DMs for details.`,
            ephemeral: false // Public
        });
    } catch (error) {
        // If DMs are closed, use ephemeral reply
        await interaction.reply({
            content: dmMessage + "\n\n⚠️ (Couldn't DM you - please enable DMs from server members)",
            ephemeral: true
        });
    }
}

export { data, execute };
export default { scheduledGreetings, nextGreetId, data, execute };