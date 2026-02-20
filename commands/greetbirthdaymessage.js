import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import cron from "node-cron";

export const scheduledGreetings = [];

function generateBirthdayMessage(name = "friend") {
  const adjectives = ["wonderful", "amazing", "fantastic", "incredible", "joyful", "magical"];
  const wishes = [
    "May your day be filled with laughter, love, and unforgettable memories.",
    "Wishing you endless happiness and success in the year ahead.",
    "May this birthday mark the beginning of your best chapter yet.",
    "Celebrate big today and enjoy every single moment — you’ve earned it!",
    "May your heart be full of joy and your life full of adventure."
  ];
  const emojis = ["🎂", "🎉", "🍰", "🌟", "💖", "🥳"];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const wish = wishes[Math.floor(Math.random() * wishes.length)];
  const emoji = emojis[Math.floor(Math.random() * emojis.length)];

  return `${emoji} Happy Birthday, ${name}! You are such a ${adj} person. ${wish}`;
}

export const birthdayCommand = {
  data: new SlashCommandBuilder()
    .setName("birthday")
    .setDescription("Send or schedule a fancy AI-style birthday greeting")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("The user to greet")
        .setRequired(false)
    )
    .addStringOption(option =>
      option.setName("mode")
        .setDescription("Send now or schedule")
        .setRequired(true)
        .addChoices(
          { name: "Send Now", value: "now" },
          { name: "Schedule", value: "schedule" }
        )
    )
    .addStringOption(option =>
      option.setName("date")
        .setDescription("Cron expression for schedule (default 9 AM daily)")
        .setRequired(false)
    ),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user");
    const name = targetUser ? targetUser.username : "friend";
    const mode = interaction.options.getString("mode");
    const cronExpr = interaction.options.getString("date") || "0 9 * * *";
    const message = generateBirthdayMessage(name);

    const thumbnailUrl = targetUser
      ? targetUser.displayAvatarURL({ extension: "png", size: 256 })
      : "https://cdn-icons-png.flaticon.com/512/2917/2917641.png";

    const embed = new EmbedBuilder()
      .setColor(0xFFC0CB)
      .setTitle("🎂 Birthday Greeting 🎂")
      .setDescription(message)
      .setThumbnail(thumbnailUrl)
      .setFooter({ text: "Generated with ❤️ by your bot" })
      .setTimestamp();

    if (mode === "now") {
      await interaction.reply({ embeds: [embed] });
    } else if (mode === "schedule") {
      await interaction.reply(`✅ Greeting scheduled with cron: \`${cronExpr}\``);

      scheduledGreetings.push({
        user: name,
        message,
        cronExpr,
        channelId: interaction.channelId,
      });

      cron.schedule(cronExpr, async () => {
        const channel = await interaction.client.channels.fetch(interaction.channelId);
        channel.send({ embeds: [embed] });
      });
    }
  },
};