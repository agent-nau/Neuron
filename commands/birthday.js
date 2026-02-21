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

// Parse date string like "February 22 2026" or "Feb 22 2026" or "22/02/2026" or "2026-02-22"
function parseDate(dateString) {
    const formats = [
        // February 22 2026 or Feb 22 2026
        /^([a-z]+)\s+(\d{1,2})\s+(\d{4})$/i,
        // 22 February 2026 or 22 Feb 2026
        /^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i,
        // 22/02/2026 or 22-02-2026
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
        // 2026-02-22 or 2026/02/22
        /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/
    ];

    const months = {
        january: 1, jan: 1,
        february: 2, feb: 2,
        march: 3, mar: 3,
        april: 4, apr: 4,
        may: 5,
        june: 6, jun: 6,
        july: 7, jul: 7,
        august: 8, aug: 8,
        september: 9, sep: 9, sept: 9,
        october: 10, oct: 10,
        november: 11, nov: 11,
        december: 12, dec: 12
    };

    const clean = dateString.trim().toLowerCase();

    // Try format: February 22 2026
    let match = clean.match(formats[0]);
    if (match) {
        const month = months[match[1]];
        const day = parseInt(match[2]);
        const year = parseInt(match[3]);
        if (month && day && year) return { day, month, year };
    }

    // Try format: 22 February 2026
    match = clean.match(formats[1]);
    if (match) {
        const day = parseInt(match[1]);
        const month = months[match[2]];
        const year = parseInt(match[3]);
        if (month && day && year) return { day, month, year };
    }

    // Try format: 22/02/2026
    match = clean.match(formats[2]);
    if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);
        if (day && month && year) return { day, month, year };
    }

    // Try format: 2026-02-22
    match = clean.match(formats[3]);
    if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]);
        const day = parseInt(match[3]);
        if (day && month && year) return { day, month, year };
    }

    return null;
}

// Calculate next occurrence of this date
function getNextOccurrence(day, month) {
    const now = new Date();
    const currentYear = now.getFullYear();
    
    // Try this year
    let targetDate = new Date(currentYear, month - 1, day, 0, 0, 0);
    
    // If date has passed, use next year
    if (targetDate < now) {
        targetDate = new Date(currentYear + 1, month - 1, day, 0, 0, 0);
    }
    
    return targetDate;
}

const data = new SlashCommandBuilder()
    .setName("birthday")
    .setDescription("Schedule a birthday greeting with @everyone mention")
    .addStringOption(option =>
        option.setName("date")
            .setDescription("Birthday date (e.g., 'February 22 2026', 'Feb 22 2026', '22/02/2026')")
            .setRequired(true))
    .addIntegerOption(option =>
        option.setName("hour")
            .setDescription("Hour to send (0-23, 24h format)")
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(23))
    .addIntegerOption(option =>
        option.setName("minute")
            .setDescription("Minute to send (0-59)")
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(59))
    .addUserOption(option =>
        option.setName("user")
            .setDescription("The user to greet (defaults to yourself)")
            .setRequired(false));

async function execute(interaction) {
    const targetUser = interaction.options.getUser("user");
    const name = targetUser ? targetUser.username : interaction.user.username;
    const dateInput = interaction.options.getString("date");
    const hour = interaction.options.getInteger("hour");
    const minute = interaction.options.getInteger("minute");

    // Parse the date
    const parsed = parseDate(dateInput);
    if (!parsed) {
        return interaction.reply({
            content: "❌ Invalid date format! Use:\n" +
                     "• `February 22 2026`\n" +
                     "• `Feb 22 2026`\n" +
                     "• `22/02/2026`\n" +
                     "• `2026-02-22`",
            ephemeral: true
        });
    }

    const { day, month, year } = parsed;

    // Validate date is real (e.g., no Feb 30)
    const testDate = new Date(year, month - 1, day);
    if (testDate.getDate() !== day || testDate.getMonth() !== month - 1) {
        return interaction.reply({
            content: "❌ Invalid date! That day doesn't exist.",
            ephemeral: true
        });
    }

    // Calculate next occurrence
    const nextOccurrence = getNextOccurrence(day, month);
    const nextYear = nextOccurrence.getFullYear();
    
    const cronExpr = `${minute} ${hour} ${day} ${month} *`;
    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const dateString = `${day}/${month}/${nextYear}`;
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

    const task = cron.schedule(cronExpr, async () => {
        const channel = await interaction.client.channels.fetch(interaction.channelId);
        if (channel) {
            await channel.send(`@everyone 🎉 It's ${name}'s Birthday! 🎉`);
            await channel.send({ embeds: [embed] });
        }
    }, { scheduled: true });

    const greeting = {
        id: greetId,
        user: name,
        targetUserId: targetUser?.id || interaction.user.id,
        message,
        day,
        month,
        hour,
        minute,
        timeString,
        originalYear: year,
        nextYear,
        cronExpr,
        channelId: interaction.channelId,
        requester: interaction.user.id,
        requesterName: interaction.user.username,
        createdAt: new Date().toISOString(),
        task
    };

    scheduledGreetings.push(greeting);

    const dmMessage = `✅ **Birthday greeting created!**\n\n` +
                     `🆔 **ID:** #${greetId}\n` +
                     `👤 **For:** ${name}\n` +
                     `📅 **Date:** ${dateString} (annual, auto-renews)\n` +
                     `⏰ **Time:** ${timeString}\n` +
                     `📢 **Mention:** @everyone\n\n` +
                     `Use \`/birthday-list\` to view all greetings.\n` +
                     `Use \`/birthday-delete id:${greetId}\` to remove this greeting.`;

    try {
        await interaction.user.send(dmMessage);
        await interaction.reply({
<<<<<<< HEAD
            content: `✅ Birthday greeting scheduled for **${name}** on **${dateString}** at **${timeString}**! Check your DMs.`,
            ephemeral: true
=======
            content: `✅ Birthday greeting scheduled! Check your DMs for details.`,
            ephemeral: true 
>>>>>>> c2a711803d7d495b2ab9266566eaf5e648eb3483
        });
    } catch (error) {
        await interaction.reply({
            content: dmMessage + "\n\n⚠️ (Couldn't DM you)",
            ephemeral: true
        });
    }
}

export { data, execute };
export default { scheduledGreetings, nextGreetId, data, execute };
