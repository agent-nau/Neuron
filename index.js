import { Client, Collection, GatewayIntentBits } from "discord.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Load commands dynamically
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const { birthdayCommand, birthdayListCommand, convertCommand, greetBirthdayMessageCommand } = await import(`file://${filePath}`);

  // Register whichever exports exist
  for (const cmd of [birthdayCommand, birthdayListCommand, convertCommand, greetBirthdayMessageCommand]) {
    if (cmd && cmd.data && cmd.execute) {
      client.commands.set(cmd.data.name, cmd);
      console.log(`✅ Loaded command: ${cmd.data.name}`);
    } else if (cmd) {
      console.log(`❌ Command at ${file} is missing "data" or "execute" property.`);
    }
  }
}

client.once("ready", () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: "❌ There was an error executing this command.", ephemeral: true });
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);