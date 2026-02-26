import { SlashCommandBuilder } from "discord.js";
import { getVoiceConnection } from "@discordjs/voice";
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

    // Stop anything playing through the manager and clear the queue
    musicManager.stop(interaction.guild.id);
    
    // Explicitly disconnect from the voice channel through DiscordJS directly
    // in case the connection was orphaned from the music manager
    const connection = getVoiceConnection(interaction.guild.id);
    if (connection) {
        connection.destroy();
    }

    await interaction.reply("👋 Left the voice channel");
}
