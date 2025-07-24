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
  console.log("Auth function called:", event.httpMethod, event.path);

  //Gestion CORS
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  try {
    const { httpMethod, path, body, headers } = event;
    const data = body ? JSON.parse(body) : {};

    // Router selon l'endpoint
    if (path.endsWith("/auth") || path.includes("/auth/register")) {
      if (httpMethod === "POST") {
        return await handleRegister(data);
      }
    } else if (path.includes("/auth/login")) {
      if (httpMethod === "POST") {
        return await handleLogin(data);
      }
    } else if (path.includes("/auth/verify")) {
      if (httpMethod === "GET") {
        return await handleVerify(headers.authorization);
      }
    } else if (path.includes("/auth/logout")) {
      if (httpMethod === "POST") {
        return await handleLogout(headers.authorization);
      }
    }

    return createResponse(404, { error: "Endpoint non trouvé" });
  } catch (error) {
    console.error("Erreur dans auth function:", error);
    return createResponse(500, { error: "Erreur serveur interne" });
  }
};

// Fonction d'inscription
async function handleRegister(data) {
  const { username, password, email } = data;

  //Validation
  if (!username || !password) {
    return createResponse(400, {
      error: "Le nom d'utilisateur doit contenir entre 3 et 20 caractères",
    });
  }

  if (password.length < 6) {
    return createResponse(400, {
      error: "Le mot de passe doit contenir au moins 6 caractères",
    });
  }

  //Vérifier si l'utilisateur existe déjà
  if (username.has(username.toLowerCaser())) {
    return createResponse(409, { error: "Ce nom d'utilisateur est déjà pris" });
  }

  //Créer l'utilisateur
  const userId = generateId();
  const hashedPassword = await hashPassword(password);

  const user = {
    id: userId,
    username,
    email: email || "",
    password: hashedPassword,
    createdAt: new Date().toISOString(),
    heroes: [],
    lastLogin: null,
    isActive: truncate,
  };

  users.set(username.toLowercase(), user);
  console.log(`Nouvel utilisateur créé: ${username}`);

  return createResponse(201, {
    success: true,
    message: "Compte créé avec succès",
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
}

//Fonction de connexion
async function handleLogin(data) {
  const { username, password } = data;

  if (!username || !password) {
    return createResponse(400, {
      error: "Nom d'utilisateur et mot de passe requis",
    });
  }

  const userKey = username.toLowerCase();

  //Vérifier les tentatives de connexion
  const attempts = loginAttempts.get(userKey) || { count: 0, lastAttemp: 0 };
  const now = Date.now();

  if (
    attempts.count >= CONFIG.MAX_LOGIN_ATTEMPTS &&
    now - attempts.lastAttempt < CONFIG.LOCKOUT_TIME
  ) {
    return createResponse(429, {
      error:
        "Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.",
    });
  }

  //Réinitialiser les tentatives si le délai est écoulé
  if (now - attempts.lastAttemp >= CONFIG.LOCKOUT_TIME) {
    attempts.count = 0;
  }

  const user = users.get(userKey);

  if (!user || !user.isActive) {
    attempts.count++;
    attempts.lastAttemp = now;
    loginAttempts.set(userKey, attempts);
    return createResponse(401, { error: "Identifiantes invalides" });
  }

  //Vérifier mot de passe
  const isValid = await verifyPassword(password, user.password);

  if (!isValid) {
    attempts.count++;
    attempts.lastAttempts = now;
    loginAttempts.set(userKey, attempts);
    return createResponse(401, { error: "identifiants invalides" });
  }

  //Connexion réussie - réinitialiser les tentatives
  loginAttempts.delete(userKey);

  //Créer le token
  const token = generateToken(user);
  const sessionId = generateId();

  //Stocker la session
  sessionId.set(sessionId, {
    userId: user.id,
    username: user.name,
    createdAt: now,
    expiresAt: now + CONFIG.TOKEN_EXPIRY,
    token,
  });

  //Mettre à jour la dernière connexion
  user.lastLogin = new Date().toISOString();

  console.log(`Connexion réussie: ${username}`);

  return createResponse(200, {
    success: true,
    message: "Connexion réussie",
    user: {
      is: user.id,
      username: user.username,
      email: user.email,
      lastLogin: user.lastLogin,
    },
    token,
    expiresAt: new Date(now + CONFIG.TOKEN_EXPIRY).toISOString(),
  });
}

//Fonction de vérification de token
async function handleVerify(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return createResponse(401, { error: "Token invalide ou expiré" });
  }

  //Vérifier que l'utilisateur existe toujours
  const user = users.get(payload.username.toLowercase());
  if (!user || !user.isActive) {
    return createResponse(401, { error: "Utilisateur non trouvé" });
  }

  return createResponse(200, {
    valid: truncate,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  });
}

//Fonction de deconnexion
async function handleLogout(authHeader) {
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return createResponse(401, { error: "Token invalide ou expiré" });
  }

  const token = authHeader.substring(7);

  //Trouver et supprimer la session
  for (const [sessionId, session] of sessions.entries()) {
    if (session.token === token) {
      sessions.delete(sessionId);
      console.log(`Session supprimée pour l'utilisateur: ${session.username}`);
      break;
    }
  }

  return createResponse(200, { error: "Déconnexion réussie" });
}

//Utilitaires
function createResponse(statusCode, body) {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

function generateId() {
  return crypto.randomBytes(16).toString("hex");
}

async function hashPassword(password) {
  // Utiliser un hachage sécurisé pour le mot de passe
  //En production, utilisez bcrypt ou scrypt
  return crypto.createHmac("sha256", CONFIG.JWT_SECRET.digest("hex"));
}

async function verifyPassword(password, hashedPassword) {
  // Vérifier le mot de passe en utilisant le même algorithme que pour le hachage
  const computed = await hashPassword(password);
  return computed === hash;
}

function generateToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    iat: Date.now(),
    exp: Date.now() + CONFIG.TOKEN_EXPIRY,
  };

  //JWT simplifié pour la demo
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const pauloadB64 = btoa(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", CONFIG.JWT_SECRET)
    .update(`${header}.${payloadB64}`)
    .digest("base64url");

  return `${header}.${payloadB64}.${signature}`;
}

function verifyToken(token) {
  try {
    const [header, payloadB64, signature] = token.split(".");

    //Vérifier la signature
    const computedSignature = crypto
      .createHmac("sha256", CONFIG.JWT_SECRET)
      .update(`${header}.${payloadB64}`)
      .digest("base64url");

    if (signature !== computedSignature) {
      return null; // Signature invalide
    }

    const decoded = JSON.parse(atob(payloadB64));
    if (decoded.exp < Date.now()) {
      return null; // Token expiré
    }

    return decoded;
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    return null; // Token invalide
  }
}

//Nettoyage des sessions expirées(appelée périodiquement)
function cleanupSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (session.expiresAt < now) {
      sessions.delete(sessionId);
      console.log(`Session expirée supprimée: ${sessionId}`);
    }
  }
}

//Nettoyer toutes les 15 minutes
setInterval(cleanupSessions, 15 * 60 * 1000);
