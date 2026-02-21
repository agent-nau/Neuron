import { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } from "discord.js";

export const scheduledGreetings = [];
export let nextGreetId = 1;
export const category = "Utility";

function getArticle(word) {
    const vowels = ['a', 'e', 'i', 'o', 'u'];
    const firstLetter = word.toLowerCase().charAt(0);
    return vowels.includes(firstLetter) ? 'an' : 'a';
}

function generateBirthdayMessage(name = "friend") {
    const adjectives = ["wonderful", "amazing", "fantastic", "incredible", "joyful", "magical", "awesome", "brilliant", "spectacular", "remarkable"];
    const wishes = [
        "May your day be filled with laughter, love, and unforgettable memories.",
        "Wishing you endless happiness and success in the year ahead.",
        "May this birthday mark the beginning of your best chapter yet.",
        "Celebrate big today and enjoy every single moment — you've earned it!",
        "May your heart be full of joy and your life full of adventure.",
        "Here's to another year of amazing achievements and beautiful moments.",
        "May all your wishes come true on this special day!"
    ];
    const emojis = ["🎂", "🎉", "🍰", "🌟", "💖", "🥳", "🎈", "🎁", "✨", "💐"];

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const wish = wishes[Math.floor(Math.random() * wishes.length)];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    const article = getArticle(adj);

    return `${emoji} Happy Birthday, ${name}! You are such ${article} ${adj} person. ${wish}`;
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
    const targetUserId = targetUser.id;
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

    // SEND NOW
    if (sendNow) {
        const birthdayMessage = generateBirthdayMessage(name);
        
        const embed = new EmbedBuilder()
            .setColor(0xFFC0CB)
            .setTitle("🎂 Birthday Greeting 🎂")
            .setDescription(birthdayMessage)
            .setThumbnail(targetUser.displayAvatarURL({ extension: "png", size: 256 }))
            .setTimestamp();

        // Send with user mention in content, embed mentions user
        const message = await interaction.channel.send({
            content: `🎉 Happy Birthday <@${targetUserId}>! 🎉`,
            embeds: [embed],
            allowedMentions: { users: [targetUserId] }
        });

        // Create thread for greetings
        const thread = await message.startThread({
            name: `🎂 ${name}'s Birthday - ${day}/${month}/${year}`,
            autoArchiveDuration: 1440, // 24 hours
            reason: 'Birthday greetings thread'
        });

        // Send initial message in thread
        await thread.send(`🎉 Drop your birthday wishes for <@${targetUserId}> here! 🎁\n\nThis thread will be deleted in 24 hours.`);

        // Schedule thread deletion and lock after 24 hours
        setTimeout(async () => {
            try {
                // Lock the thread
                await thread.setLocked(true, 'Birthday over - thread locked');
                // Delete the thread
                await thread.delete('Birthday thread expired (24 hours)');
            } catch (err) {
                console.error('Failed to delete birthday thread:', err);
            }
        }, 24 * 60 * 60 * 1000); // 24 hours

        // Silent reply (no visible message)
        await interaction.reply({ content: '✅', ephemeral: true });
        
        return;
    }

    // SCHEDULE
    if (hour === null || minute === null) {
        return interaction.reply({
            content: "❌ Please provide both `hour` and `minute` to schedule, or use `send_now:True`!",
            ephemeral: true
        });
    }

    const scheduleDate = new Date(year, month - 1, day, hour, minute, 0);
    
    if (scheduleDate < new Date()) {
        return interaction.reply({
            content: "❌ That date and time is in the past! Please use a future date.",
            ephemeral: true
        });
    }

    const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    const dateString = `${day}/${month}/${year}`;
    const greetId = nextGreetId++;

    // Calculate when to delete thread (24 hours after send)
    const threadDeleteTime = scheduleDate.getTime() + (24 * 60 * 60 * 1000);

    const delayMs = scheduleDate.getTime() - Date.now();
    
    const timeoutId = setTimeout(async () => {
        try {
            const channel = await interaction.client.channels.fetch(interaction.channelId);
            if (!channel) return;

            const freshMessage = generateBirthdayMessage(name);
            
            const embed = new EmbedBuilder()
                .setColor(0xFFC0CB)
                .setTitle("🎂 Birthday Greeting 🎂")
                .setDescription(freshMessage)
                .setThumbnail(targetUser.displayAvatarURL({ extension: "png", size: 256 }))
                .setTimestamp();

            // Send with user mention
            const message = await channel.send({
                content: `🎉 Happy Birthday <@${targetUserId}>! 🎉`,
                embeds: [embed],
                allowedMentions: { users: [targetUserId] }
            });

            // Create thread
            const thread = await message.startThread({
                name: `🎂 ${name}'s Birthday - ${day}/${month}/${year}`,
                autoArchiveDuration: 1440,
                reason: 'Birthday greetings thread'
            });

            await thread.send(`🎉 Drop your birthday wishes for <@${targetUserId}> here! 🎁\n\nThis thread will be deleted in 24 hours.`);

            // Schedule thread deletion after 24 hours
            const deleteDelay = threadDeleteTime - Date.now();
            setTimeout(async () => {
                try {
                    await thread.setLocked(true, 'Birthday over - thread locked');
                    await thread.delete('Birthday thread expired (24 hours)');
                } catch (err) {
                    console.error('Failed to delete scheduled birthday thread:', err);
                }
            }, Math.max(deleteDelay, 0));

        } catch (err) {
            console.error('Birthday send failed:', err);
        }
        
        // Remove from list after sending
        const idx = scheduledGreetings.findIndex(g => g.id === greetId);
        if (idx > -1) scheduledGreetings.splice(idx, 1);
        
    }, delayMs);

    const greeting = {
        id: greetId,
        user: name,
        targetUserId,
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
        sendAt: scheduleDate.toISOString(),
        threadDeleteAt: new Date(threadDeleteTime).toISOString()
    };

    scheduledGreetings.push(greeting);

    // Silent confirmation (no visible reply)
    await interaction.reply({ 
        content: `✅ Scheduled for **${name}** on **${dateString}** at **${timeString}**!`,
        ephemeral: true 
    });
}

export { data, execute };
export default { scheduledGreetings, nextGreetId, data, execute };