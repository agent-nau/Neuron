import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const category = 'Utility';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const data = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all commands by category')
    .addIntegerOption(option =>
        option.setName('page')
            .setDescription('Page number')
            .setRequired(false)
            .setMinValue(1));

// Cache categories
let categoriesCache = null;

async function getCategories() {
    if (categoriesCache) return categoriesCache;
    
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    const categoryMap = new Map();
    
    for (const file of commandFiles) {
        const filePath = path.join('file://', commandsPath, file);
        const module = await import(filePath);
        
        const command = module.default || module;
        if (!command.data) continue;
        
        // READ CATEGORY EXPORT
        const category = module.category || 'Uncategorized';
        const cmdName = `/${command.data.name}`;
        const desc = command.data.description;
        
        // Build usage
        let usage = cmdName;
        if (command.data.options?.length) {
            usage += ' ' + command.data.options.map(opt => 
                opt.required ? `<${opt.name}>` : `[${opt.name}]`
            ).join(' ');
        }
        
        if (!categoryMap.has(category)) {
            categoryMap.set(category, []);
        }
        
        categoryMap.get(category).push({ name: cmdName, desc, usage });
    }
    
    // Sort categories alphabetically
    categoriesCache = Array.from(categoryMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, commands]) => ({ name, commands }));
    
    return categoriesCache;
}

async function execute(interaction) {
    const categories = await getCategories();
    const totalPages = categories.length;
    const page = Math.min(interaction.options.getInteger('page') || 1, totalPages);
    
    const { name, commands } = categories[page - 1];
    
    const embed = new EmbedBuilder()
        .setTitle(`${name}`)
        .setDescription(`Page ${page}/${totalPages} • ${commands.length} commands`)
        .setColor(0x5865F2)
        .setTimestamp();
    
    commands.forEach(cmd => {
        embed.addFields({
            name: cmd.name,
            value: `${cmd.desc}\n\`${cmd.usage}\``,
            inline: false
        });
    });
    
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`help_prev_${page}`)
                .setLabel('◀️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 1),
            new ButtonBuilder()
                .setCustomId('help_page')
                .setLabel(`${page}/${totalPages}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId(`help_next_${page}`)
                .setLabel('▶️')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === totalPages)
        );
    
    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

export { data, execute };
export default { data, execute };