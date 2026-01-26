import { SlashCommandIntegerOption, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder} from "discord.js"; 

export const category = "Utility";
export const data = {
    name: "setup-selfrole-menu",
    description: "Sets up a self-role menu in the specified channel.",
    options: [
        new SlashCommandIntegerOption()
            .setName("channel")
            .setDescription("The channel to set up the menu in.")
            .setRequired(true)
    ]
};

export async function execute(i) {
    const channel = i.options.getChannel("channel");
    const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder() 
            .setCustomId("selfroles")
            .setPlaceholder("Select a role")
            .addOptions([
                new StringSelectMenuOptionBuilder()
                    .setLabel("Role 1")
                    .setValue("role1"),
                    new StringSelectMenuOptionBuilder()
                    .setLabel("Role 2")
                    .setValue("role2"),
                    new StringSelectMenuOptionBuilder()
                    .setLabel("Role 3")
                    .setValue("role3")
            ])
    );
    await channel.send({ content: "Select a role:", components: [row] });
    await i.reply({ content: "✅ Self-role menu set up.", ephemeral: true });
}       r()
r()
            .setPlaceholder("Select a role")
            .addOptions([
                new StringSelectMenuOptionBuilder()
                    .setLabel("Role 1")
                    .setValue("role1"),
                    new StringSelectMenuOptionBuilder()
                    .setLabel("Role 2")
                    .setValue("role2"),
                    new StringSelectMenuOptionBuilder()
                    .setLabel("Role 3")
                    .setValue("role3")
            ])