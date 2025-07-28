// Service d'authentification pour Heroes Arena
class AuthService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api/auth';
        this.currentUser = null;
        this.token = localStorage.getItem('heroes_arena_token');
        
        // Callbacks
        this.onLogin = null;
        this.onLogout = null;
        this.onError = null;
        
        console.log('🔐 Auth Service initialisé');
        
        // Vérifier le token au démarrage
        this.checkAuthOnStartup();
    }

    // ==================== MÉTHODES UTILITAIRES ====================

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            ...options
        };

        // Ajouter le token si disponible
        if (this.token) {
            defaultOptions.headers['Authorization'] = `Bearer ${this.token}`;
        }

        try {
            console.log(`🔗 Auth Request: ${defaultOptions.method} ${url}`);
            
            const response = await fetch(url, defaultOptions);
            const data = await response.json();

            if (!response.ok) {
                // Token expiré ou invalide
                if (response.status === 401 || response.status === 403) {
                    this.logout();
                }
                throw new Error(data.error || `Erreur HTTP: ${response.status}`);
            }

            return data;

        } catch (error) {
            console.error('❌ Auth Error:', error.message);
            
            if (this.onError) {
                this.onError(error);
            }
            
            throw error;
        }
    }

    // ==================== GESTION DES TOKENS ====================

    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('heroes_arena_token', token);
            console.log('✅ Token sauvegardé');
        } else {
            localStorage.removeItem('heroes_arena_token');
            console.log('🗑️ Token supprimé');
        }
    }

    getToken() {
        return this.token;
    }

    isAuthenticated() {
        return !!this.token && !!this.currentUser;
    }

    // ==================== GITHUB SSO ====================

    // Rediriger vers GitHub OAuth
    loginWithGitHub() {
        console.log('🔄 Redirection vers GitHub OAuth...');
        window.location.href = `${this.baseURL}/github`;
    }

    // Gérer le retour de GitHub OAuth
    async handleGitHubCallback() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            const userJson = urlParams.get('user');
            const error = urlParams.get('error');
            const errorMessage = urlParams.get('message');

            // Nettoyer l'URL
            window.history.replaceState({}, document.title, window.location.pathname);

            if (error) {
                const errorMsg = this.getErrorMessage(error, errorMessage);
                throw new Error(errorMsg);
            }

            if (!token || !userJson) {
                throw new Error('Données d\'authentification manquantes');
            }

            const user = JSON.parse(decodeURIComponent(userJson));
            
            // Sauvegarder les données d'authentification
            this.setToken(token);
            this.currentUser = user;
            
            console.log('✅ Authentification GitHub réussie:', user.username);
            
            if (this.onLogin) {
                this.onLogin(user);
            }
            
            return { success: true, user };

        } catch (error) {
            console.error('❌ Erreur callback GitHub:', error.message);
            
            if (this.onError) {
                this.onError(error);
            }
            
            return { success: false, error: error.message };
        }
    }

    // Lier un compte GitHub (pour utilisateurs existants)
    async linkGitHub(code) {
        try {
            const result = await this.request('/link-github', {
                method: 'POST',
                body: JSON.stringify({ code })
            });

            console.log('✅ Compte GitHub lié');
            
            // Mettre à jour l'utilisateur actuel
            if (this.currentUser) {
                this.currentUser.github = result.data.github;
            }
            
            return result;

        } catch (error) {
            console.error('❌ Erreur liaison GitHub:', error.message);
            throw error;
        }
    }

    // Délier un compte GitHub
    async unlinkGitHub() {
        try {
            const result = await this.request('/unlink-github', {
                method: 'DELETE'
            });

            console.log('✅ Compte GitHub délié');
            
            // Mettre à jour l'utilisateur actuel
            if (this.currentUser) {
                delete this.currentUser.github;
            }
            
            return result;

        } catch (error) {
            console.error('❌ Erreur déliaison GitHub:', error.message);
            throw error;
        }
    }

    // ==================== GESTION UTILISATEUR ====================

    // Obtenir l'utilisateur connecté
    async getCurrentUser() {
        try {
            if (!this.token) {
                return null;
            }

            const result = await this.request('/me');
            this.currentUser = result.data;
            
            return this.currentUser;

        } catch (error) {
            console.error('❌ Erreur récupération utilisateur:', error.message);
            this.logout();
            return null;
        }
    }

    // Rafraîchir le token
    async refreshToken() {
        try {
            const result = await this.request('/refresh', {
                method: 'POST'
            });

            this.setToken(result.data.token);
            console.log('✅ Token rafraîchi');
            
            return result.data.token;

        } catch (error) {
            console.error('❌ Erreur rafraîchissement token:', error.message);
            this.logout();
            throw error;
        }
    }

    // ==================== DÉCONNEXION ====================

    async logout() {
        try {
            if (this.token) {
                // Informer le serveur de la déconnexion
                await this.request('/logout', {
                    method: 'POST'
                }).catch(() => {
                    // Ignorer les erreurs, on déconnecte quand même
                });
            }

            // Nettoyer les données locales
            this.setToken(null);
            this.currentUser = null;
            
            console.log('👋 Déconnexion réussie');
            
            if (this.onLogout) {
                this.onLogout();
            }

        } catch (error) {
            console.error('❌ Erreur déconnexion:', error.message);
            
            // Forcer la déconnexion locale même si le serveur répond pas
            this.setToken(null);
            this.currentUser = null;
            
            if (this.onLogout) {
                this.onLogout();
            }
        }
    }

    // ==================== UTILITAIRES ====================

    // Vérifier l'authentification au démarrage
    async checkAuthOnStartup() {
        if (this.token) {
            console.log('🔍 Vérification du token au démarrage...');
            await this.getCurrentUser();
        }
    }

    // Obtenir le message d'erreur approprié
    getErrorMessage(error, message) {
        const errorMessages = {
            'github_oauth_denied': 'Accès refusé par GitHub. Veuillez réessayer.',
            'no_auth_code': 'Code d\'autorisation manquant. Veuillez réessayer.',
            'invalid_state': 'Erreur de sécurité. Veuillez réessayer.',
            'auth_failed': 'Échec de l\'authentification. Vérifiez vos permissions GitHub.',
            'callback_error': 'Erreur lors du callback GitHub.',
            'email_not_verified': 'Votre email GitHub doit être vérifié. Vérifiez votre email sur GitHub.',
            'email_not_accessible': 'Impossible d\'accéder à votre email GitHub. Assurez-vous qu\'il est public ou vérifié.',
            'no_email_found': 'Aucun email trouvé sur votre compte GitHub. Ajoutez un email vérifié.'
        };

        return errorMessages[error] || message || `Erreur d'authentification: ${error}`;
    }

    // Obtenir la configuration d'authentification
    async getConfig() {
        try {
            const result = await this.request('/config');
            return result.data;
        } catch (error) {
            console.error('❌ Erreur récupération config:', error.message);
            return null;
        }
    }

    // ==================== ÉVÉNEMENTS ====================

    // Définir les callbacks
    setCallbacks({ onLogin, onLogout, onError }) {
        if (onLogin) this.onLogin = onLogin;
        if (onLogout) this.onLogout = onLogout;
        if (onError) this.onError = onError;
    }

    // ==================== HELPERS POUR L'UI ====================

    // Obtenir les informations utilisateur pour l'affichage
    getUserDisplayInfo() {
        if (!this.currentUser) return null;

        return {
            id: this.currentUser.id,
            username: this.currentUser.username,
            email: this.currentUser.email,
            avatar: this.currentUser.avatar || '/assets/avatars/default.png',
            role: this.currentUser.role,
            verified: this.currentUser.emailVerified,
            authMethod: this.currentUser.authMethod,
            hasGitHub: !!this.currentUser.github,
            githubUsername: this.currentUser.github?.username
        };
    }

    // Vérifier les permissions
    hasRole(role) {
        if (!this.currentUser) return false;
        
        const roles = ['player', 'moderator', 'admin'];
        const userRoleIndex = roles.indexOf(this.currentUser.role);
        const requiredRoleIndex = roles.indexOf(role);
        
        return userRoleIndex >= requiredRoleIndex;
    }

    // Vérifier si l'utilisateur peut effectuer une action
    canPerformAction(action) {
        if (!this.isAuthenticated()) return false;

        const permissions = {
            'create_hero': ['player', 'moderator', 'admin'],
            'delete_hero': ['player', 'moderator', 'admin'],
            'moderate_users': ['moderator', 'admin'],
            'admin_panel': ['admin']
        };

        const allowedRoles = permissions[action];
        return allowedRoles && allowedRoles.includes(this.currentUser.role);
    }
}

// Instance globale
export const authService = new AuthService();

// Pour compatibilité avec l'ancien système
window.authService = authService;