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

// Add detailed debug logging
client.on('debug', console.log);


client.commands = new Collection();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = await import(filePath);
  client.commands.set(command.data.name, command);
}

const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = await import(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args, { warnings, verifSettings, verifCodes, joinSettings, generateCode, client }));
  }
}

// Error handling
client.on('error', error => {
  console.error('🚨 Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('🚨 Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('🚨 Uncaught exception:', error);
  process.exit(1);
});

const token = process.env.DISCORD_BOT_TOKEN;

if (!token) {
  console.error('❌ DISCORD_BOT_TOKEN is not set!');
  process.exit(1);
}

console.log('📡 Attempting to login...');

const login = async () => {
  try {
    await Promise.race([
      client.login(token),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Login timed out after 15 seconds.')), 15000)
      )
    ]);
  } catch (err) {
    console.error(`❌ Login failed: ${err.message}`);
    console.error('This is likely a network issue. Please check if Render can connect to Discord\'s gateway.');
    process.exit(1);
  }
};

login();