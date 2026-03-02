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

  // Function to get current rating text formatted consistently
  const getRatingText = (data) => data.total_reviews > 0 
    ? `⭐ ${data.average_rating.toFixed(1)} (${data.total_reviews})`
    : "⭐ New!";

  const baseStatuses = [
    { name: "Made by Lecs @ Vecs Corp.", type: ActivityType.Playing },
    { name: "/help for commands", type: ActivityType.Listening },
    { name: `Protected ${client.guilds.cache.size} Servers!`, type: ActivityType.Watching },
  ];

  let i = 0;
  setInterval(async () => {
    // Refresh everything for the update
    const ratingData = await loadRatings();
    const ratingText = getRatingText(ratingData);
    
    const activity = baseStatuses[i];
    client.user.setPresence({ 
      activities: [{ 
        name: `${activity.name} | ${ratingText}`, 
        type: activity.type 
      }], 
      status: "idle" 
    });

    i = (i + 1) % baseStatuses.length;
  }, 15000);
}