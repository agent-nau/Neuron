import { ActivityType, REST, Routes } from "discord.js";

export const name = "ready";
export const once = true;

export async function execute(client) {
  console.log(`✅ Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);
  const commands = client.commands.map(c => c.data.toJSON());

  try {
    await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
    console.log("🌍 Global commands registered");
  } catch (e) {
    console.error("❌ Command registration error:", e);
  }

  const baseStatuses = [
    { name: "Made by Lecs @ Vecs Corp.", type: ActivityType.Playing },
    { name: "/help for commands", type: ActivityType.Listening },
    { name: `Protecting ${client.guilds.cache.size} Servers!`, type: ActivityType.Watching },
  ];

  let i = 0;
  setInterval(async () => {
    const activity = baseStatuses[i];
    client.user.setPresence({ 
      activities: [{ 
        name: activity.name, 
        type: activity.type 
      }], 
      status: "idle" 
    });

    i = (i + 1) % baseStatuses.length;
  }, 15000);
}