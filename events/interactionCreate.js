import {
  EmbedBuilder,
  MessageFlags,
} from "discord.js";

export const name = "interactionCreate";

export async function execute(i, { warnings, verifSettings, verifCodes, joinSettings, generateCode, client }) {
  try {
    // 🚀 Slash Command Interaction
    if (i.isChatInputCommand()) {
      const command = client.commands.get(i.commandName);
      if (!command) return;

      try {
        await command.execute(i, { warnings, verifSettings, verifCodes, joinSettings, generateCode, client });
      } catch (error) {
        console.error(`Error executing command ${i.commandName}:`, error);
        const errorMessage = { content: '❌ There was an error while executing this command!', flags: MessageFlags.Ephemeral };
        if (i.deferred || i.replied) {
          await i.editReply(errorMessage);
        } else {
          await i.reply(errorMessage);
        }
      }
      return;
    }

    // 📖 Help menu category selection
    if (i.isStringSelectMenu() && i.customId === "help-category") {
      const selectedCategory = i.values[0];
      const commands = [...client.commands.values()].filter(cmd => cmd.category === selectedCategory);

      const embed = new EmbedBuilder()
        .setTitle(`📘 ${selectedCategory} Commands`)
        .setDescription(`Commands in the ${selectedCategory} category:`)
        .setColor(0x00bfff);

      if (commands.length === 0) {
        embed.setDescription("No commands in this category.");
      } else {
        for (const cmd of commands) {
          embed.addFields({
            name: `/${cmd.data.name}`,
            value: cmd.data.description || "No description",
          });
        }
      }

      return await i.update({ embeds: [embed], components: [] });
    }

    // 📩 Route all other interactions to command-specific handlers
    // This makes the bot "Stateless" by letting commands handle interactions based on data encoded in Custom IDs
    if (!i.isChatInputCommand()) {
      for (const command of client.commands.values()) {
        if (typeof command.handleInteraction === 'function') {
          try {
            await command.handleInteraction(i, { warnings, verifSettings, verifCodes, joinSettings, generateCode, client });
          } catch (error) {
            console.error(`Error in handleInteraction for command:`, error);
          }
        }
      }
    }

  } catch (error) {
    console.error("interactionCreate error:", error);
  }
}