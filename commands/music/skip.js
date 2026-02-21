const { SlashCommandBuilder } = require('discord.js');
const musicManager = require('../../managers/MusicManager');

export const category = 'Music';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skip to the next song'),

    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;
        const botChannel = interaction.guild.members.me.voice.channel;
        
        if (!voiceChannel || (botChannel && voiceChannel.id !== botChannel.id)) {
            return interaction.reply({ 
                content: '❌ You need to be in the same voice channel as me!', 
                ephemeral: true 
            });
        }

        musicManager.playNext(interaction.guild.id, interaction.channel);
        await interaction.reply('⏭️ Skipped to the next song!');
    },
};