import { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder } from 'discord.js';

export const category = 'Role Management';

export const data = new SlashCommandBuilder()
  .setName('setupmenuroleadd')
  .setDescription('Setup a role menu with descriptions')
  .addRoleOption(option =>
    option.setName('role1')
      .setDescription('First role to add')
      .setRequired(true))
  .addStringOption(option =>
    option.setName('roledescription1')
      .setDescription('Description for the first role')
      .setRequired(true));

export async function execute(interaction) {
  const role1 = interaction.options.getRole('role1');
  const desc1 = interaction.options.getString('roledesc1');

  const menu = new StringSelectMenuBuilder()
    .setCustomId('role-menu')
    .setPlaceholder('Choose your role')
    .addOptions([
      {
        label: role1.name,
        description: desc1, 
        value: role1.id
      }
    ]);

  const row = new ActionRowBuilder().addComponents(menu);

  const embed = new EmbedBuilder()
    .setTitle('Role Menu')
    .setDescription('Select one of the roles below!')
    .setColor(0x00AE86);

  await interaction.reply({ embeds: [embed], components: [row] });
}