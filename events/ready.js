export const name = "ready";
export const once = true;

export async function execute(client) {
  console.log(`Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);
  const body = client.commands.map(c => c.data.toJSON());

  try {
    // 🌍 Register commands globally
    await rest.put(Routes.applicationCommands(client.user.id), { body });
    console.log("🌍 Global commands registered");
  } catch (e) {
    console.error("❌ Command registration error:", e);
  }

  const statuses = [
    { name: "Made by Lecs @ Vecs Corp.", type: ActivityType.Playing },
    { name: "for spam and raids", type: ActivityType.Watching },
    { name: "/help for commands", type: ActivityType.Listening },
  ];

  let i = 0;
  setInterval(() => {
    client.user.setPresence({ activities: [statuses[i]], status: "idle" });
    i = (i + 1) % statuses.length;
  }, 15000);
}
