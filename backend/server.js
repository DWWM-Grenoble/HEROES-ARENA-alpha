require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const session = require('express-session');

const database = require('./config/database');

// Import des routes
const heroRoutes = require('./routes/heroes');
const combatRoutes = require('./routes/combats');
const userRoutes = require('./routes/users');
const statsRoutes = require('./routes/stats');
const { router: authRoutes } = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

// ==================== MIDDLEWARES ====================

// Sécurité
app.use(helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// CORS
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT_MAX || 100, // max 100 requêtes par fenêtre
    message: {
        error: 'Trop de requêtes, veuillez réessayer plus tard.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/', limiter);

// Session middleware (pour OAuth state)
app.use(session({
    secret: process.env.JWT_SECRET || 'heroes-arena-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000 // 10 minutes pour OAuth state
    }
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging des requêtes
app.use((req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path} - ${req.ip}`);
    next();
});

// ==================== ROUTES ====================

// Route de santé
app.get('/health', async (req, res) => {
    try {
        const dbStats = await database.getStats();
        
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: {
                connected: database.isConnected(),
                state: database.getConnectionState(),
                stats: dbStats
            },
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || '1.0.0'
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: error.message
        });
    }
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/heroes', heroRoutes);
app.use('/api/combats', combatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stats', statsRoutes);

// Route de test rapide
app.get('/api/test', (req, res) => {
    res.json({
        message: '🎮 Heroes Arena API opérationnelle !',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// ==================== GESTION D'ERREURS ====================

// Middleware de gestion d'erreurs 404
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route non trouvée',
        path: req.originalUrl,
        method: req.method
    });
});

// Middleware global de gestion d'erreurs
app.use((error, req, res, next) => {
    console.error('❌ Erreur serveur:', error);
    
    // Erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(e => e.message);
        return res.status(400).json({
            error: 'Erreur de validation',
            details: errors
        });
    }
    
    // Erreur de cast MongoDB (ID invalide)
    if (error.name === 'CastError') {
        return res.status(400).json({
            error: 'ID invalide',
            path: error.path
        });
    }
    
    // Erreur de duplication MongoDB
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue)[0];
        return res.status(400).json({
            error: 'Valeur déjà existante',
            field: field,
            value: error.keyValue[field]
        });
    }
    
    // Erreur générique
    res.status(error.status || 500).json({
        error: error.message || 'Erreur interne du serveur',
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
});

// ==================== DÉMARRAGE DU SERVEUR ====================

async function startServer() {
    try {
        // Connexion à la base de données
        await database.connect();
        
        // Créer les index si nécessaire
        await database.createIndexes();
        
        // Démarrer le serveur
        const server = app.listen(PORT, () => {
            console.log(`🚀 Serveur Heroes Arena démarré !`);
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`🌍 Environnement: ${process.env.NODE_ENV}`);
            console.log(`📊 Base de données: ${database.isConnected() ? '✅ Connectée' : '❌ Déconnectée'}`);
            console.log('=====================================');
        });
        
        // Gestion de l'arrêt propre
        const gracefulShutdown = async (signal) => {
            console.log(`\n🛑 Signal ${signal} reçu, arrêt du serveur...`);
            
            server.close(async () => {
                console.log('🔌 Serveur HTTP fermé');
                
                try {
                    await database.disconnect();
                    console.log('👋 Déconnexion DB réussie');
                    process.exit(0);
                } catch (error) {
                    console.error('❌ Erreur déconnexion DB:', error);
                    process.exit(1);
                }
            });
        };
        
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        
    } catch (error) {
        console.error('❌ Erreur de démarrage:', error);
        process.exit(1);
    }
}

// Gestion des erreurs non gérées
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesse rejetée non gérée:', reason);
    console.error('À:', promise);
});

process.on('uncaughtException', (error) => {
    console.error('❌ Exception non gérée:', error);
    process.exit(1);
});

// Démarrer le serveur
startServer();

module.exports = app;