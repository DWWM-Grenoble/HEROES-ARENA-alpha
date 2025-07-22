import crypto from 'crypto';


// Base de données simulée pour les héros
const userHeroes = new Map(); // userId -> array of heroes
const heroStats = new Map(); // global stats


// Configuration

const CONFIG = {
    JWT_SECRET: process.env.JWT_SECRET|| "heroes-arena-secret-2024",
    MAX_HEROES_PER_USER: 50,
    MAX_HERO_NAME_LENGTH: 20,
    MIN_HERO_NAME_LENGTH: 2
};