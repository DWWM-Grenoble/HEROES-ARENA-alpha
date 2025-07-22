import crypto from "crypto";

//Base de données somulée ( remplacer par une vraie BD en production)
const users = new Map();
const sessions = new Map();
const loginAttempts = new Map();

//Configuration
const CONFIG = {
  JWT_SECRET: process.env.JWT_SeCReT || "heroes-arena-secret-2024",
  TOKEN_EXPIRY: 24 * 60 * 60 * 1000, //24 heures
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_TIME: 15 * 60 * 1000, // 15 Minutes
};

// Headers CORS
const corsHeaders = {
  'Acces_Control-Allow'
}