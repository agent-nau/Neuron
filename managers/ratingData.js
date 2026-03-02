import { readFile, writeFile } from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const RATINGS_FILE = path.join(DATA_DIR, 'ratings.json');
const CONFIG_FILE = path.join(DATA_DIR, 'ratingConfig.json');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
}

// Default data structure
const defaultData = {
    ratings: [],
    total_reviews: 0,
    average_rating: 0.0
};

// Load ratings from file
export async function loadRatings() {
    try {
        const data = await readFile(RATINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch {
        return { ...defaultData };
    }
}

// Save ratings to file
export async function saveRatings(data) {
    await writeFile(RATINGS_FILE, JSON.stringify(data, null, 2));
}

// Calculate average rating
export function calculateAverage(ratings) {
    if (!ratings.length) return 0.0;
    return ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length;
}

// Format rating as stars string
export function formatStars(rating) {
    const full = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return '⭐'.repeat(full) + (hasHalf ? '½' : '') + '☆'.repeat(5 - full - (hasHalf ? 1 : 0));
}

// Set ratings channel for a guild
export async function setRatingsChannel(guildId, channelId) {
    let config = {};
    try {
        const data = await readFile(CONFIG_FILE, 'utf8');
        config = JSON.parse(data);
    } catch {
        // File doesn't exist, start fresh
    }
    
    config[guildId] = channelId;
    await writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
}

// Get ratings channel for a guild
export async function getRatingsChannel(guildId) {
    try {
        const data = await readFile(CONFIG_FILE, 'utf8');
        const config = JSON.parse(data);
        return config[guildId] || null;
    } catch {
        return null;
    }
}