export const name = "guildMemberAdd";

export async function execute(member, { joinSettings }) {
  try {
    const s = joinSettings.get(member.guild.id);
    if (!s || !s.enabled) return;
    const role = member.guild.roles.cache.get(s.roleId);
    if (!role) return console.warn(`Auto-assign role not found in guild ${member.guild.id}`);
    await member.roles.add(role);
    console.log(`Auto-assigned role ${role.name} to ${member.user.tag}`);
  } catch (err) {
    console.error("Auto-assign error:", err);
  }
}