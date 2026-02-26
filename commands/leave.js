import { SlashCommandBuilder } from "discord.js";
import MusicManager from "../managers/MusicManager.js";

export const category = "Music";

export const data = new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Leaves the voice channel");

export async function execute(interaction) {
    const player = MusicManager.get(interaction.guild.id);
    if (!player) {
        return interaction.reply("No music is being played");
    }
    player.destroy();
    await interaction.reply("Left the voice channel");
}