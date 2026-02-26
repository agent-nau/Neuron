import { SlashCommandBuilder } from "discord.js";
import musicManager from "../managers/MusicManager.js";

export const category = "Music";

export const data = new SlashCommandBuilder()
    .setName("leave")
    .setDescription("Leaves the voice channel");

export async function execute(interaction) {
    const voiceChannel = interaction.member.voice.channel;
    const botChannel = interaction.guild.members.me.voice.channel;
    
    if (!voiceChannel || (botChannel && voiceChannel.id !== botChannel.id)) {
        return interaction.reply({ 
            content: '❌ You need to be in the same voice channel as me!', 
            ephemeral: true 
        });
    }

    musicManager.stop(interaction.guild.id);
    await interaction.reply("👋 Left the voice channel");
}