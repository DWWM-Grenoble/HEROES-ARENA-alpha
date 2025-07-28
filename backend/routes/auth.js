const express = require('express');
const router = express.Router();
const GitHubAuthService = require('../services/GitHubAuthService');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ==================== MIDDLEWARE D'AUTHENTIFICATION ====================

// Middleware pour vérifier le JWT
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Token d\'accès requis'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Récupérer l'utilisateur complet
        const user = await User.findById(decoded.userId).select('-password');
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Utilisateur non trouvé'
            });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(403).json({
            success: false,
            error: 'Token invalide'
        });
    }
};

// ==================== ROUTES D'AUTHENTIFICATION ====================

// GET /api/auth/config - Configuration d'authentification
router.get('/config', (req, res) => {
    try {
        const config = GitHubAuthService.getConfig();
        
        res.json({
            success: true,
            data: {
                github: config,
                jwtExpire: process.env.JWT_EXPIRE || '7d'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/auth/github - Initier l'authentification GitHub
router.get('/github', (req, res) => {
    try {
        if (!GitHubAuthService.isConfigured()) {
            return res.status(500).json({
                success: false,
                error: 'GitHub OAuth non configuré. Vérifiez les variables d\'environnement.'
            });
        }

        // Générer et stocker le state pour la sécurité
        const state = GitHubAuthService.generateState();
        
        // En production, stockez le state en session ou cache
        // Pour cet exemple, on le passe directement
        req.session = req.session || {};
        req.session.githubState = state;

        const authURL = GitHubAuthService.getAuthorizationURL(state);
        
        console.log('🔗 Redirection vers GitHub OAuth');
        res.redirect(authURL);

    } catch (error) {
        console.error('❌ Erreur initiation GitHub OAuth:', error);
        res.status(500).json({
            success: false,
            error: 'Erreur lors de l\'initiation de l\'authentification GitHub'
        });
    }
});

// GET /api/auth/github/callback - Callback GitHub OAuth
router.get('/github/callback', async (req, res) => {
    try {
        const { code, state, error } = req.query;

        // Vérifier s'il y a une erreur GitHub
        if (error) {
            console.error('❌ Erreur GitHub OAuth:', error);
            return res.redirect(`${process.env.FRONTEND_URL}?error=github_oauth_denied`);
        }

        // Vérifier le code d'autorisation
        if (!code) {
            console.error('❌ Code d\'autorisation manquant');
            return res.redirect(`${process.env.FRONTEND_URL}?error=no_auth_code`);
        }

        // TODO: Vérifier le state en production
        // const expectedState = req.session?.githubState;
        // if (!GitHubAuthService.validateState(state, expectedState)) {
        //     return res.redirect(`${process.env.FRONTEND_URL}?error=invalid_state`);
        // }

        // Authentifier avec GitHub
        const authResult = await GitHubAuthService.authenticateWithCode(code);

        if (!authResult.success) {
            console.error('❌ Échec authentification:', authResult.error);
            return res.redirect(`${process.env.FRONTEND_URL}?error=auth_failed`);
        }

        // Rediriger vers le frontend avec le token
        const redirectURL = `${process.env.FRONTEND_URL}?token=${authResult.token}&user=${encodeURIComponent(JSON.stringify(authResult.user))}`;
        
        console.log('✅ Authentification réussie, redirection vers frontend');
        res.redirect(redirectURL);

    } catch (error) {
        console.error('💥 Erreur callback GitHub:', error.message);
        res.redirect(`${process.env.FRONTEND_URL}?error=callback_error&message=${encodeURIComponent(error.message)}`);
    }
});

// POST /api/auth/github/token - Authentification avec code (pour SPA)
router.post('/github/token', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Code d\'autorisation requis'
            });
        }

        const authResult = await GitHubAuthService.authenticateWithCode(code);

        res.json(authResult);

    } catch (error) {
        console.error('❌ Erreur authentification token:', error.message);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/auth/logout - Déconnexion
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        // En production, vous pourriez vouloir blacklister le token
        // ou le stocker dans une liste de tokens révoqués
        
        res.json({
            success: true,
            message: 'Déconnexion réussie'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// GET /api/auth/me - Obtenir l'utilisateur connecté
router.get('/me', authenticateToken, (req, res) => {
    try {
        res.json({
            success: true,
            data: {
                id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                emailVerified: req.user.emailVerified,
                avatar: req.user.profile.avatar,
                role: req.user.role,
                authMethod: req.user.authMethod,
                github: req.user.github,
                stats: req.user.stats,
                profile: req.user.profile
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/auth/refresh - Rafraîchir le token JWT
router.post('/refresh', authenticateToken, async (req, res) => {
    try {
        // Générer un nouveau token avec les mêmes données
        const newToken = GitHubAuthService.generateJWT(req.user);

        res.json({
            success: true,
            data: {
                token: newToken,
                expiresIn: process.env.JWT_EXPIRE || '7d'
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// POST /api/auth/link-github - Lier un compte GitHub à un compte existant
router.post('/link-github', authenticateToken, async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Code d\'autorisation GitHub requis'
            });
        }

        // Récupérer les données GitHub
        const accessToken = await GitHubAuthService.exchangeCodeForToken(code);
        const gitHubData = await GitHubAuthService.fetchUserData(accessToken);

        // Vérifier que ce compte GitHub n'est pas déjà lié
        const existingUser = await User.findOne({ 'github.id': gitHubData.id.toString() });
        if (existingUser && !existingUser._id.equals(req.user._id)) {
            return res.status(400).json({
                success: false,
                error: 'Ce compte GitHub est déjà lié à un autre utilisateur'
            });
        }

        // Lier le compte GitHub
        req.user.github = {
            id: gitHubData.id.toString(),
            username: gitHubData.login,
            profileUrl: gitHubData.html_url,
            avatarUrl: gitHubData.avatar_url,
            connectedAt: new Date()
        };

        await req.user.save();

        res.json({
            success: true,
            message: 'Compte GitHub lié avec succès',
            data: {
                github: req.user.github
            }
        });

    } catch (error) {
        console.error('❌ Erreur liaison GitHub:', error.message);
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// DELETE /api/auth/unlink-github - Délier un compte GitHub
router.delete('/unlink-github', authenticateToken, async (req, res) => {
    try {
        if (!req.user.github || !req.user.github.id) {
            return res.status(400).json({
                success: false,
                error: 'Aucun compte GitHub lié'
            });
        }

        // Vérifier que l'utilisateur a un autre moyen de se connecter
        if (req.user.authMethod === 'github' && !req.user.password) {
            return res.status(400).json({
                success: false,
                error: 'Impossible de délier GitHub : c\'est votre seul moyen de connexion. Définissez d\'abord un mot de passe.'
            });
        }

        req.user.github = undefined;
        await req.user.save();

        res.json({
            success: true,
            message: 'Compte GitHub délié avec succès'
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ==================== EXPORT ====================

module.exports = {
    router,
    authenticateToken
};