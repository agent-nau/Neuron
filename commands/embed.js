import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType } from "discord.js";

const colorMap = {
  red: "#ff0000", blue: "#0000ff", green: "#00ff00", yellow: "#ffff00",
  purple: "#800080", orange: "#ffa500", pink: "#ffc0cb", black: "#000000",
  white: "#ffffff", gray: "#808080", cyan: "#00ffff", magenta: "#ff00ff",
};

export const category = "Utility";

export const data = new SlashCommandBuilder()
  .setName("embed")
  .setDescription("Send an embed as the bot")
  .addStringOption(o => o.setName("description").setDescription("Embed description").setRequired(true))
  .addStringOption(o => o.setName("title").setDescription("Embed title"))
  .addStringOption(o => o.setName("color").setDescription("Embed color"))
  .addStringOption(o => o.setName("footer").setDescription("Embed footer"))
  .addStringOption(o => o.setName("image").setDescription("Embed image URL"))
  .addStringOption(o => o.setName("thumbnail").setDescription("Embed thumbnail URL"))
  .addChannelOption(o => o.setName("channel").setDescription("Target channel").addChannelTypes(ChannelType.GuildText))
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

export async function execute(i) {
  const description = i.options.getString("description");
  const title = i.options.getString("title");
  let color = i.options.getString("color");
  const footer = i.options.getString("footer");
  const image = i.options.getString("image");
  const thumb = i.options.getString("thumbnail");
  const target = i.options.getChannel("channel") || i.channel;

  const embed = new EmbedBuilder().setDescription(description);
  if (title) embed.setTitle(title);
  if (color) color = colorMap[color.toLowerCase()] || color;
  if (color) embed.setColor(color);
  if (footer) embed.setFooter({ text: footer });
  if (image) embed.setImage(image);
  if (thumb) embed.setThumbnail(thumb);

  try {
    await target.send({ embeds: [embed] });
    await i.reply({ content: "✅ Embed sent!", ephemeral: true });
  } catch {
    await i.reply({ content: "❌ Failed to send embed", ephemeral: true });
  }
}
