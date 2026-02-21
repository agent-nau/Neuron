import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const scheduledGreetings = [];
export let nextGreetId = 1;
export const category = 'Utility';

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

function parseDate(dateString) {
    const formats = [
        /^([a-z]+)\s+(\d{1,2})\s+(\d{4})$/i,
        /^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i,
        /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/,
        /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/
    ];

    const months = {
        january: 1, jan: 1, february: 2, feb: 2, march: 3, mar: 3,
        april: 4, apr: 4, may: 5, june: 6, jun: 6, july: 7, jul: 7,
        august: 8, aug: 8, september: 9, sep: 9, sept: 9,
        october: 10, oct: 10, november: 11, nov: 11, december: 12, dec: 12
    };

    const clean = dateString.trim().toLowerCase();
    let match = clean.match(formats[0]);
    
    if (match) {
        const month = months[match[1]];
        const day = parseInt(match[2]);
        const year = parseInt(match[3]);
        if (month && day && year) return { day, month, year };
    }

    match = clean.match(formats[1]);
    if (match) {
        const day = parseInt(match[1]);
        const month = months[match[2]];
        const year = parseInt(match[3]);
        if (month && day && year) return { day, month, year };
    }

    match = clean.match(formats[2]);
    if (match) {
        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);
        if (day && month && year) return { day, month, year };
    }

    match = clean.match(formats[3]);
    if (match) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]);
        const day = parseInt(match[3]);
        if (day && month && year) return { day, month, year };
    }

    return null;
}

const data = new SlashCommandBuilder()
    .setName("birthday")
    .setDescription("Send or schedule a birthday greeting (one-time)")
    .addUserOption(option =>
        option.setName("user")
            .setDescription("The user to greet")
            .setRequired(true))
    .addStringOption(option =>
        option.setName("date")
            .setDescription("Birthday date (e.g., 'February 22 2026', '22/02/2026')")
            .setRequired(true))
    .addBooleanOption(option =>
        option.setName("send_now")
            .setDescription("Send the birthday message immediately")
            .setRequired(false))
    .addIntegerOption(option =>
        option.setName("hour")
            .setDescription("Hour to schedule (0-23, can't use with send_now)")
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(23))
    .addIntegerOption(option =>
        option.setName("minute")
            .setDescription("Minute to schedule (0-59, can't use with send_now)")
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(59));

async function execute(interaction) {
    const targetUser = interaction.options.getUser("user");
    const name = targetUser.username;
    const dateInput = interaction.options.getString("date");
    const sendNow = interaction.options.getBoolean("send_now") ?? false;
    const hour = interaction.options.getInteger("hour");
    const minute = interaction.options.getInteger("minute");

    // Validate: can't use send_now with hour/minute
    if (sendNow && (hour !== null || minute !== null)) {
        return interaction.reply({
            content: "❌ **Pick one:** `send_now:True` **OR** set `hour`/`minute`, not both!",
            ephemeral: true
        });
    }

    // Validate date
    const parsed = parseDate(dateInput);
    if (!parsed) {
        return interaction.reply({
            content: "❌ Invalid date! Use: `February 22 2026`, `22/02/2026`, or `2026-02-22`",
            ephemeral: true
        });
    }

    const { day, month, year } = parsed;
    const testDate = new Date(year, month - 1, day);
    if (testDate.getDate() !== day || testDate.getMonth() !== month - 1) {
        return interaction.reply({
            content: "❌ Invalid date! That day doesn't exist.",
            ephemeral: true
        });
    }

    const thumbnailUrl = targetUser.displayAvatarURL({ extension: "png", size: 256 });

    // SEND NOW - sends embed only
    if (sendNow) {
        const birthdayMessage = generateBirthdayMessage(name);
        
        const embed = new EmbedBuilder()
            .setColor(0xFFC0CB)
            .setTitle("🎂 Birthday Greeting 🎂")
            .setDescription(birthdayMessage)
            .setThumbnail(thumbnailUrl)
            .setTimestamp();

        // Send embed with @everyone in content
        await interaction.reply({
            content: `@everyone 🎉 It's ${name}'s Birthday! 🎉`,
            embeds: [embed],
            allowedMentions: { parse: ['everyone'] }
        });
        
        return;
    }

    // SCHEDULE - validate hour/minute
    if (hour === null || minute === null) {
        return interaction.reply({
            content: "❌ Please provide both `hour` and `minute` to schedule, or use `send_now:True`!",
            ephemeral: true
        });
    }

    // Build exact date for one-time schedule
    const scheduleDate = new Date(year, month - 1, day, hour, minute, 0);
    
    // Check if date is in the past
    if (scheduleDate < new Date()) {
        return interaction.reply({
            content: "❌ That date and time is in the past! Please use a future date.",
            ephemeral: true
        });
    }

    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const dateString = `${day}/${month}/${year}`;
    const greetId = nextGreetId++;

    // ONE-TIME schedule using timeout
    const delayMs = scheduleDate.getTime() - Date.now();
    
    const timeoutId = setTimeout(async () => {
        try {
            const channel = await interaction.client.channels.fetch(interaction.channelId);
            if (channel) {
                // FRESH embed created at send time
                const freshMessage = generateBirthdayMessage(name);
                
                const embed = new EmbedBuilder()
                    .setColor(0xFFC0CB)
                    .setTitle("🎂 Birthday Greeting 🎂")
                    .setDescription(freshMessage)
                    .setThumbnail(thumbnailUrl)
                    .setTimestamp();

                // Single message with @everyone + embed
                await channel.send({
                    content: `@everyone 🎉 It's ${name}'s Birthday! 🎉`,
                    embeds: [embed]
                });
            }
        } catch (err) {
            console.error('Birthday send failed:', err);
        }
        
        // Remove from list after sending
        const idx = scheduledGreetings.findIndex(g => g.id === greetId);
        if (idx > -1) scheduledGreetings.splice(idx, 1);
        
    }, delayMs);

    // Store greeting data
    const greeting = {
        id: greetId,
        user: name,
        targetUserId: targetUser.id,
        day,
        month,
        year,
        hour,
        minute,
        timeString,
        dateString,
        channelId: interaction.channelId,
        requester: interaction.user.id,
        requesterName: interaction.user.username,
        createdAt: new Date().toISOString(),
        timeoutId,
        sendAt: scheduleDate.toISOString()
    };

    scheduledGreetings.push(greeting);

    const dmMessage = `✅ **Birthday scheduled! (ONE-TIME)**\n\n🆔 **ID:** #${greetId}\n👤 **For:** ${name}\n📅 **Date:** ${dateString}\n⏰ **Time:** ${timeString}\n\nUse \`/birthday-delete id:${greetId}\` to cancel.`;

    try {
        await interaction.user.send(dmMessage);
        await interaction.reply({
            content: `✅ Scheduled for **${name}** on **${dateString}** at **${timeString}**! Check DMs.`,
            ephemeral: false
        });
    } catch {
        await interaction.reply({ content: dmMessage, ephemeral: true });
    }
}

export { data, execute };
export default { scheduledGreetings, nextGreetId, data, execute };