import { Client, GatewayIntentBits, Collection } from "discord.js";
import { startKeepAlive } from "./keep-alive.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "url";
import { warnings, verifSettings, verifCodes, joinSettings, generateCode } from "./state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("🚀 Initializing Bot...");
startKeepAlive();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates, // Added for music
    ],
});

client.on('debug', () => {});

client.commands = new Collection();

// Load commands (including subdirectories)
const commandsPath = path.join(__dirname, "commands");

function loadCommandsFromDir(dirPath) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
            // Recursively load from subdirectories
            loadCommandsFromDir(fullPath);
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
            loadCommand(fullPath);
        }
    }
}

async function loadCommand(filePath) {
    try {
        const command = await import(filePath);
        if ('data' in command && 'execute' in command) {
            client.commands.set(command.data.name, command);
            console.log(`✅ Loaded command: ${command.data.name}`);
        } else {
            console.log(`❌ Command at ${filePath} is missing "data" or "execute" property.`);
        }
    } catch(error) {
        console.error(`❌ Failed to load command at ${filePath}:`, error);
    }
}

// Start loading commands
loadCommandsFromDir(commandsPath);

// Load events
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith(".js"));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = await import(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, { warnings, verifSettings, verifCodes, joinSettings, generateCode, client }));
    } else {
        client.on(event.name, (...args) => event.execute(...args, { warnings, verifSettings, verifCodes, joinSettings, generateCode, client }));
    }
}

client.login(process.env.DISCORD_BOT_TOKEN);