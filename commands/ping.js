import { SlashCommandBuilder } from "discord.js";

export const category = "Utility";
export const data = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Ping");

export async function execute(i) {
  await i.reply(`🏓 Pong! ${i.client.ws.ping}ms`);
}
