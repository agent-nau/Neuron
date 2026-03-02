import { ActivityType, REST, Routes } from "discord.js";
import { loadRatings } from "../managers/ratingData.js";

export const name = "clientReady";
export const once = true;

export async function execute(client) {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);
  const body = client.commands.map(c => c.data.toJSON());

  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body });
    console.log("🌍 Global commands registered");
  } catch (e) {
    console.error("❌ Command registration error:", e);
  }

  // Load ratings for status
  const ratingData = await loadRatings();
  const ratingText = ratingData.total_reviews > 0 
    ? `⭐ ${ratingData.average_rating.toFixed(1)} (${ratingData.total_reviews})`
    : "⭐ New!";

  const statuses = [
    { name: "Made by Lecs @ Vecs Corp.", type: ActivityType.Playing },
    { name: "/help for commands", type: ActivityType.Listening },
    { name: `Protected ${client.guilds.cache.size} Servers!`, type: ActivityType.Watching },
    { name: ratingText, type: ActivityType.Custom }, // Shows as "⭐ 4.9 (142)"
  ];

  let i = 0;
  setInterval(() => {
    // Refresh rating every rotation to keep it updated
    if (statuses[i].name.startsWith("⭐")) {
      loadRatings().then(data => {
        if (data.total_reviews > 0) {
          statuses[i].name = `⭐ ${data.average_rating.toFixed(1)} (${data.total_reviews})`;
        }
      });
    }
    
    client.user.setPresence({ activities: [statuses[i]], status: "idle" });
    i = (i + 1) % statuses.length;
  }, 15000);
}