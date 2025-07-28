const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class GitHubAuthService {
    constructor() {
        this.clientId = process.env.GITHUB_CLIENT_ID;
        this.clientSecret = process.env.GITHUB_CLIENT_SECRET;
        this.callbackURL = process.env.GITHUB_CALLBACK_URL;
        
        if (!this.clientId || !this.clientSecret) {
            console.error('❌ GitHub OAuth credentials manquantes dans .env');
        } else {
            console.log('✅ GitHub OAuth configuré');
        }
    }

    // Générer l'URL d'autorisation GitHub
    getAuthorizationURL(state = null) {
        const baseURL = 'https://github.com/login/oauth/authorize';
        const params = new URLSearchParams({
            client_id: this.clientId,
            redirect_uri: this.callbackURL,
            scope: 'user:email', // Permission pour lire l'email même s'il n'est pas public
            state: state || this.generateState()
        });

        const authURL = `${baseURL}?${params.toString()}`;
        console.log('🔗 URL d\'autorisation GitHub générée');
        return authURL;
    }

    // Échanger le code d'autorisation contre un access token
    async exchangeCodeForToken(code) {
        try {
            console.log('🔄 Échange du code d\'autorisation...');
            
            const response = await axios.post('https://github.com/login/oauth/access_token', {
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code: code
            }, {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Heroes-Arena-App'
                }
            });

            if (response.data.error) {
                throw new Error(`GitHub OAuth Error: ${response.data.error_description || response.data.error}`);
            }

            const accessToken = response.data.access_token;
            if (!accessToken) {
                throw new Error('Aucun access token reçu de GitHub');
            }

            console.log('✅ Access token obtenu avec succès');
            return accessToken;

        } catch (error) {
            console.error('❌ Erreur lors de l\'échange du code:', error.message);
            throw new Error(`Échec de l'authentification GitHub: ${error.message}`);
        }
    }

    // Récupérer les informations utilisateur depuis GitHub
    async fetchUserData(accessToken) {
        try {
            console.log('👤 Récupération des données utilisateur GitHub...');
            
            const headers = {
                'Authorization': `token ${accessToken}`,
                'User-Agent': 'Heroes-Arena-App',
                'Accept': 'application/vnd.github.v3+json'
            };

            // Récupérer les informations de base de l'utilisateur
            const userResponse = await axios.get('https://api.github.com/user', { headers });
            const userData = userResponse.data;

            console.log(`✅ Données utilisateur récupérées: ${userData.login}`);

            // Récupérer les emails (même privés avec le scope user:email)
            const emailData = await this.fetchUserEmails(accessToken);

            return {
                ...userData,
                emails: emailData
            };

        } catch (error) {
            console.error('❌ Erreur récupération données utilisateur:', error.message);
            throw new Error(`Impossible de récupérer les données utilisateur: ${error.message}`);
        }
    }

    // Récupérer les emails de l'utilisateur (même privés)
    async fetchUserEmails(accessToken) {
        try {
            console.log('📧 Récupération des emails utilisateur...');
            
            const headers = {
                'Authorization': `token ${accessToken}`,
                'User-Agent': 'Heroes-Arena-App',
                'Accept': 'application/vnd.github.v3+json'
            };

            const emailResponse = await axios.get('https://api.github.com/user/emails', { headers });
            const emails = emailResponse.data;

            console.log(`✅ ${emails.length} email(s) trouvé(s)`);
            
            // Journaliser les emails pour debug
            emails.forEach(email => {
                console.log(`  📧 ${email.email} - Vérifié: ${email.verified} - Principal: ${email.primary}`);
            });

            return emails;

        } catch (error) {
            console.error('❌ Erreur récupération emails:', error.message);
            // Si on ne peut pas récupérer les emails, on continue avec l'email public
            return [];
        }
    }

    // Trouver le meilleur email à utiliser
    selectBestEmail(userData) {
        const emails = userData.emails || [];
        
        // Stratégie de sélection d'email (par ordre de préférence) :
        // 1. Email principal ET vérifié
        // 2. Email vérifié (n'importe lequel)
        // 3. Email principal (même non vérifié)
        // 4. Email public du profil
        // 5. Premier email disponible

        // 1. Email principal et vérifié
        let selectedEmail = emails.find(email => email.primary && email.verified);
        if (selectedEmail) {
            console.log('✅ Email principal vérifié sélectionné');
            return {
                email: selectedEmail.email,
                verified: true,
                source: 'primary_verified'
            };
        }

        // 2. Email vérifié (n'importe lequel)
        selectedEmail = emails.find(email => email.verified);
        if (selectedEmail) {
            console.log('✅ Email vérifié sélectionné');
            return {
                email: selectedEmail.email,
                verified: true,
                source: 'verified'
            };
        }

        // 3. Email principal (même non vérifié)
        selectedEmail = emails.find(email => email.primary);
        if (selectedEmail) {
            console.log('⚠️ Email principal non vérifié sélectionné');
            return {
                email: selectedEmail.email,
                verified: false,
                source: 'primary_unverified'
            };
        }

        // 4. Email public du profil
        if (userData.email) {
            console.log('⚠️ Email public du profil sélectionné');
            return {
                email: userData.email,
                verified: false, // On ne peut pas vérifier le statut
                source: 'public_profile'
            };
        }

        // 5. Premier email disponible
        if (emails.length > 0) {
            console.log('⚠️ Premier email disponible sélectionné');
            return {
                email: emails[0].email,
                verified: emails[0].verified,
                source: 'first_available'
            };
        }

        // Aucun email trouvé
        throw new Error('Aucun email accessible. Veuillez vérifier que votre compte GitHub a un email vérifié et accessible.');
    }

    // Créer ou mettre à jour l'utilisateur dans la base de données
    async createOrUpdateUser(gitHubData) {
        try {
            console.log('👤 Création/mise à jour utilisateur...');
            
            const emailInfo = this.selectBestEmail(gitHubData);
            const githubId = gitHubData.id.toString();

            // Chercher l'utilisateur existant par GitHub ID ou email
            let user = await User.findOne({
                $or: [
                    { 'github.id': githubId },
                    { email: emailInfo.email }
                ]
            });

            if (user) {
                // Mettre à jour l'utilisateur existant
                console.log(`🔄 Mise à jour utilisateur existant: ${user.username}`);
                
                user.github = {
                    id: githubId,
                    username: gitHubData.login,
                    profileUrl: gitHubData.html_url,
                    avatarUrl: gitHubData.avatar_url
                };
                
                user.email = emailInfo.email;
                user.profile.avatar = gitHubData.avatar_url;
                user.derniereCo = new Date();
                
                // Marquer comme vérifié si l'email GitHub est vérifié
                if (emailInfo.verified && !user.emailVerified) {
                    user.emailVerified = true;
                    console.log('✅ Email marqué comme vérifié');
                }

            } else {
                // Créer un nouvel utilisateur
                console.log(`✨ Création nouvel utilisateur: ${gitHubData.login}`);
                
                user = new User({
                    username: gitHubData.login,
                    email: emailInfo.email,
                    emailVerified: emailInfo.verified,
                    password: 'github_sso', // Mot de passe factice pour les utilisateurs SSO
                    github: {
                        id: githubId,
                        username: gitHubData.login,
                        profileUrl: gitHubData.html_url,
                        avatarUrl: gitHubData.avatar_url
                    },
                    profile: {
                        avatar: gitHubData.avatar_url
                    },
                    authMethod: 'github'
                });
            }

            await user.save();
            console.log(`✅ Utilisateur sauvegardé: ${user.username} (${user.email})`);
            
            return user;

        } catch (error) {
            console.error('❌ Erreur création/mise à jour utilisateur:', error.message);
            throw error;
        }
    }

    // Générer un JWT pour l'utilisateur
    generateJWT(user) {
        const payload = {
            userId: user._id,
            username: user.username,
            email: user.email,
            role: user.role,
            authMethod: 'github'
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRE || '7d'
        });

        console.log(`✅ JWT généré pour ${user.username}`);
        return token;
    }

    // Processus complet d'authentification GitHub
    async authenticateWithCode(code) {
        try {
            console.log('🚀 Démarrage authentification GitHub SSO...');
            
            // 1. Échanger le code contre un access token
            const accessToken = await this.exchangeCodeForToken(code);
            
            // 2. Récupérer les données utilisateur
            const gitHubData = await this.fetchUserData(accessToken);
            
            // 3. Créer ou mettre à jour l'utilisateur
            const user = await this.createOrUpdateUser(gitHubData);
            
            // 4. Générer le JWT
            const jwt = this.generateJWT(user);
            
            console.log('🎉 Authentification GitHub réussie !');
            
            return {
                success: true,
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email,
                    avatar: user.profile.avatar,
                    role: user.role,
                    authMethod: 'github'
                },
                token: jwt
            };

        } catch (error) {
            console.error('💥 Échec authentification GitHub:', error.message);
            throw error;
        }
    }

    // Générer un state token pour la sécurité
    generateState() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    // Valider le state token
    validateState(receivedState, expectedState) {
        return receivedState === expectedState;
    }

    // Vérifier la configuration
    isConfigured() {
        return !!(this.clientId && this.clientSecret && this.callbackURL);
    }

    // Obtenir les informations de configuration (sans secrets)
    getConfig() {
        return {
            configured: this.isConfigured(),
            clientId: this.clientId,
            callbackURL: this.callbackURL,
            scopes: ['user:email']
        };
    }
}

module.exports = new GitHubAuthService();