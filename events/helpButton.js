import { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Reuse the same getCategories function
let categoriesCache = null;
let lastCacheTime = 0;
const CACHE_DURATION = 60000; // 1 minute

async function getCategories() {
    const now = Date.now();
    if (categoriesCache && (now - lastCacheTime) < CACHE_DURATION) {
        return categoriesCache;
    }
    
    const commandsPath = path.join(__dirname, '..', 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    const categoryMap = new Map();
    
    for (const file of commandFiles) {
        const filePath = path.join('file://', commandsPath, file);
        const module = await import(filePath + '?t=' + now); // Cache bust
        
        const command = module.default || module;
        if (!command.data) continue;
        
        const category = module.category || '⚡ Uncategorized';
        const cmdName = `/${command.data.name}`;
        const desc = command.data.description;
        
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
    
    categoriesCache = Array.from(categoryMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([name, commands]) => ({ name, commands }));
    
    lastCacheTime = now;
    return categoriesCache;
}

export default {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isButton()) return;
        if (!interaction.customId.startsWith('help_')) return;
        
        const categories = await getCategories();
        const totalPages = categories.length;
        const [_, action, current] = interaction.customId.split('_');
        let page = parseInt(current);
        
        if (action === 'prev') page--;
        if (action === 'next') page++;
        page = Math.max(1, Math.min(page, totalPages));
        
        const { name, commands } = categories[page - 1];
        
        const embed = new EmbedBuilder()
            .setTitle(name)
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
        
        await interaction.update({ embeds: [embed], components: [row] });
    }
};