console.log('--- RUNNING LATEST VERSION OF INDEX.JS ---');

let i = 0;
setInterval(() => {
  console.log(`-- Event Loop Tick: ${i++} --`);
}, 1000);

import { Client, GatewayIntentBits, Collection } from "discord.js";
import { startKeepAlive } from "./keep-alive.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import { warnings, verifSettings, verifCodes, joinSettings, generateCode } from "./state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🛡️ Starting Security & Ticket Bot...");
startKeepAlive();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Optional debug logs
client.on("debug", console.log);

client.commands = new Collection();

// Load commands
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(filePath);
  client.commands.set(command.data.name, command);
}

// Load events
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = await import(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) =>
      event.execute(...args, {
        warnings,
        verifSettings,
        verifCodes,
        joinSettings,
        generateCode,
        client
      })
    );
  }
}

// Login
const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.log("❌ DISCORD_BOT_TOKEN is not set!");
  process.exit(1);
}

console.log("📡 Logging in...");
client.login(token);