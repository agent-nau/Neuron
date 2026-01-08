import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";

export const category = "Moderation";
export const data = new SlashCommandBuilder()
  .setName("lockdown")
  .setDescription("Lock or unlock this channel")
  .addStringOption(o => o.setName("action").setDescription("lock/unlock").setRequired(true).addChoices(
    { name: "Lock", value: "lock" }, { name: "Unlock", value: "unlock" }
  ))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

export async function execute(i) {
  const action = i.options.getString("action");
  const locked = action === "lock";

  try {
    await i.channel.permissionOverwrites.edit(i.guild.roles.everyone, {
      SendMessages: !locked
    });

    await i.reply(`🔒 Channel **${locked ? "locked" : "unlocked"}**.`);
  } catch {
    await i.reply({ content: "❌ Failed to modify permissions", ephemeral: true });
  }
}
