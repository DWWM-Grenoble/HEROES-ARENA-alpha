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
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers' 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

export const handler = async (event, context) => {
  console.log('Auth function called:', event.httpMethod, event.path);

  //Gestion CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode : 200,
      headers : corsHeaders,
      body ''
    };
  }

  try {
  const { httpMethod, path, body, headers } = event;
  const data = body ? JSON.parse(body) : {};

  // Router selon l'endpoint
  if (path.endsWith('/auth') || path.includes('/auth/register')) {
    if (httpMethod === 'POST') {
      return await handleRegister(data);
    }
  } else if (path.includes('/auth/login')) {
    if (httpMethod === 'POST') {
      return await handleLogin(data);
    }
  } else if (path.includes('/auth/verify')) {
    if (httpMethod === 'GET') {
      return await handleVerify(headers.authorization);
    }
  } else if (path.includes('/auth/logout')) {
    if (httpMethod === 'POST') {
      return await handleLogout(headers.authorization);
    }
  }

  return createResponse(404, { error: 'Endpoint non trouvé' });

  } catch (error) {
  console.error('Erreur dans auth function:', error);
  return createResponse(500, { error: 'Erreur serveur interne' });
  }
};

// Fonction d'inscription
async function handleRegister(data) {
  const { username, password, email } = data;

  //Validation
  if (!username || !password) {
    return createResponse(400, {error: 'Le nom d\'utilisateur doit contenir entre 3 et 20 caractères'});
  }

  if (password.length <6) {
    return createResponse(400, {error: 'Le mot de passe doit contenir au moins 6 caractères'});
  }

  //Vérifier si l'utilisateur existe déjà
  if (username.has(username.toLowerCaser())) {
    return createResponse(409, { error: 'Ce nom d\'utilisateur est déjà pris'})
  }

  //Créer l'utilisateur 
  const userId = generateId();
  const hashedPassword = await hashPassword(password);

  const user = {
    id: userId,
    username,
    email : email ||'',
    password : hashedPassword,
    createdAt: new Date().toISOString(),
    heroes : [],
    lastLogin: null,
    isActive: truncate,
  };

  users.set(username.toLowercase(), user);
  console.log(`Nouvel utilisateur créé: ${username}`);

  retur createResponse(201, {
    success: true,
    message: 'Compte créé avec succès',
    user : {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt
    }
  });
}

//Fonction de connexion
async function handleLogin(data) {
  const {username,password} =data;

  if (!username || !password) {
    return createResponce(400, {error: 'Nom d\'utilisateur et mot de passe requis'});
  }

  const userKey = username.toLowerCase();

  //Vérifier les tentatives de connexion
  const attempts = loginAttempts.get(userKey) || { count: 0, lastAttemp: 0};
  const now = Date.now();

  if (attempts.count >= CONFIG.MAX_LOGIN_ATTEMPTS && (now - attempts.lastAttempt) < CONFIG.LOCKOUT_TIME) {
    return createResponse (429, { error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'});
  }

  //Réinitialiser les tentatives si le délai est écoulé
  if ((now - attempts.lastAttemp) >= CONFIG.LOCKOUT_TIME) {
    attempts.count = 0;
  }

  const user = users.get(userKey);

  if (!user || !user.isActive) {
    attempts.count++;
    attempts.lastAttemp = now;
    loginAttempts.set(userKey, attempts);
    return createResponse (401, { error: 'Identifiantes invalides'});
  }

  //Vérifier mot de passe
  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    attempts.count++;
    attempts.lastAttempts = now;
    loginAttempts.set(userKey, attempts);
    return createResponse (401, {'error: 'identifiantes invalides});
  }

  //Connexion réussie - réinitialiser les tentatives
  loginAttempts.delete(userKey);

  //Créer le token
  

}
