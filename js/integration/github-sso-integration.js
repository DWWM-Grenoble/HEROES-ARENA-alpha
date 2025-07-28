// Script d'intégration GitHub SSO pour Heroes Arena
import { authService } from '../services/auth-service.js';
import { authUI } from '../components/auth-ui.js';
import { databaseService } from '../services/database-service.js';

class GitHubSSOIntegration {
    constructor() {
        this.isIntegrated = false;
        console.log('🔗 GitHub SSO Integration initialisé');
    }

    // Intégrer GitHub SSO avec l'application existante
    async integrate() {
        if (this.isIntegrated) return;

        try {
            console.log('🚀 Démarrage intégration GitHub SSO...');

            // 1. Initialiser l'interface d'authentification
            authUI.init();

            // 2. Configurer les callbacks pour intégrer avec l'app existante
            this.setupAppIntegration();

            // 3. Vérifier l'état d'authentification
            await this.checkInitialAuthState();

            // 4. Intégrer avec les services existants
            this.integrateWithExistingServices();

            this.isIntegrated = true;
            console.log('✅ GitHub SSO intégré avec succès');

        } catch (error) {
            console.error('❌ Erreur intégration GitHub SSO:', error);
            throw error;
        }
    }

    // Configurer les callbacks pour l'intégration avec l'app
    setupAppIntegration() {
        authService.setCallbacks({
            onLogin: (user) => this.onUserLogin(user),
            onLogout: () => this.onUserLogout(),
            onError: (error) => this.onAuthError(error)
        });
    }

    // Vérifier l'état d'authentification initial
    async checkInitialAuthState() {
        try {
            if (authService.isAuthenticated()) {
                const user = await authService.getCurrentUser();
                if (user) {
                    console.log('✅ Utilisateur déjà connecté:', user.username);
                    await this.syncUserWithApp(user);
                }
            }
        } catch (error) {
            console.warn('⚠️ Erreur vérification état initial:', error.message);
        }
    }

    // Intégrer avec les services existants de l'application
    integrateWithExistingServices() {
        // Configurer le service de base de données avec l'authentification
        databaseService.onError = (error) => {
            if (error.message.includes('token') || error.message.includes('unauthorized')) {
                console.warn('⚠️ Erreur d\'authentification détectée, déconnexion...');
                authService.logout();
            }
        };

        // Ajouter l'authentification aux requêtes de base de données
        const originalRequest = databaseService.request.bind(databaseService);
        databaseService.request = async (endpoint, options = {}) => {
            // Ajouter le token JWT si disponible
            const token = authService.getToken();
            if (token) {
                options.headers = options.headers || {};
                options.headers['Authorization'] = `Bearer ${token}`;
            }
            
            return originalRequest(endpoint, options);
        };
    }

    // ==================== CALLBACKS D'AUTHENTIFICATION ====================

    async onUserLogin(user) {
        try {
            console.log('🎉 Utilisateur connecté via GitHub:', user.username);

            // 1. Synchroniser avec l'AppState existant
            await this.syncUserWithApp(user);

            // 2. Charger les héros de l'utilisateur
            await this.loadUserHeroes(user.id);

            // 3. Mettre à jour l'interface utilisateur
            this.updateAppInterface(user);

            // 4. Notification de bienvenue
            this.showWelcomeMessage(user);

        } catch (error) {
            console.error('❌ Erreur synchronisation utilisateur:', error);
            authUI.showError('Erreur lors de la synchronisation des données');
        }
    }

    onUserLogout() {
        console.log('👋 Déconnexion utilisateur');

        // 1. Nettoyer les données de l'application
        this.clearAppData();

        // 2. Rediriger vers la page d'accueil si nécessaire
        if (window.location.hash === '#arena' || window.location.hash === '#heroes') {
            window.location.hash = '#home';
            
            // Déclencher l'événement de changement de section si disponible
            if (window.uiManager && window.uiManager.showSection) {
                window.uiManager.showSection('home');
            }
        }

        // 3. Masquer les sections nécessitant une authentification
        this.hideAuthRequiredSections();
    }

    onAuthError(error) {
        console.error('❌ Erreur d\'authentification:', error.message);
        
        // Afficher l'erreur à l'utilisateur
        authUI.showError(error.message);
        
        // Nettoyer les données si nécessaire
        this.clearAppData();
    }

    // ==================== SYNCHRONISATION AVEC L'APP ====================

    async syncUserWithApp(user) {
        try {
            // Mettre à jour AppState si disponible
            if (window.AppState) {
                window.AppState.currentUser = {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    avatar: user.avatar,
                    role: user.role,
                    isAuthenticated: true,
                    authMethod: 'github'
                };
                
                console.log('✅ AppState mis à jour avec l\'utilisateur');
            }

            // Déclencher l'événement personnalisé
            window.dispatchEvent(new CustomEvent('userAuthenticated', {
                detail: { user }
            }));

        } catch (error) {
            console.error('❌ Erreur synchronisation AppState:', error);
        }
    }

    async loadUserHeroes(userId) {
        try {
            console.log('🦸 Chargement des héros utilisateur...');
            
            const response = await databaseService.getUserHeroes(userId);
            const heroes = databaseService.convertHeroesFromDB(response.data);

            // Mettre à jour AppState avec les héros
            if (window.AppState) {
                window.AppState.heroes = heroes;
                console.log(`✅ ${heroes.length} héros chargés`);
            }

            // Déclencher l'événement de mise à jour des héros
            window.dispatchEvent(new CustomEvent('heroesLoaded', {
                detail: { heroes }
            }));

            // Mettre à jour l'interface si on est sur la section héros
            if (window.uiManager && window.location.hash === '#heroes') {
                window.uiManager.displayHeroes();
            }

        } catch (error) {
            console.error('❌ Erreur chargement héros:', error);
            authUI.showError('Impossible de charger vos héros');
        }
    }

    updateAppInterface(user) {
        // Masquer les boutons de connexion locaux si ils existent
        const localAuthElements = document.querySelectorAll('.local-auth, .login-prompt');
        localAuthElements.forEach(el => el.style.display = 'none');

        // Afficher les sections nécessitant une authentification
        this.showAuthRequiredSections();

        // Mettre à jour les éléments de l'interface avec les infos utilisateur
        const userNameElements = document.querySelectorAll('.user-name, [data-user-name]');
        userNameElements.forEach(el => el.textContent = user.username);

        const userAvatarElements = document.querySelectorAll('.user-avatar, [data-user-avatar]');
        userAvatarElements.forEach(el => {
            if (el.tagName === 'IMG') {
                el.src = user.avatar;
            } else {
                el.style.backgroundImage = `url(${user.avatar})`;
            }
        });
    }

    showWelcomeMessage(user) {
        // Notification de bienvenue personnalisée
        const welcomeMsg = user.authMethod === 'github' ? 
            `Bienvenue ${user.username} ! Connecté via GitHub 🐙` :
            `Bienvenue ${user.username} !`;
        
        authUI.showNotification(welcomeMsg, 'success');

        // Message spécial pour les nouveaux utilisateurs
        if (window.AppState && window.AppState.heroes.length === 0) {
            setTimeout(() => {
                authUI.showNotification('Créez votre premier héros pour commencer !', 'info');
            }, 2000);
        }
    }

    // ==================== GESTION DE L'INTERFACE ====================

    showAuthRequiredSections() {
        const authSections = document.querySelectorAll('[data-auth-required]');
        authSections.forEach(section => {
            section.style.display = '';
            section.classList.remove('auth-hidden');
        });

        // Afficher les liens de navigation nécessitant une auth
        const navLinks = document.querySelectorAll('nav a[href="#heroes"], nav a[href="#arena"]');
        navLinks.forEach(link => {
            link.style.display = '';
            link.classList.remove('auth-hidden');
        });
    }

    hideAuthRequiredSections() {
        const authSections = document.querySelectorAll('[data-auth-required]');
        authSections.forEach(section => {
            section.style.display = 'none';
            section.classList.add('auth-hidden');
        });

        // Masquer les liens de navigation nécessitant une auth
        const navLinks = document.querySelectorAll('nav a[href="#heroes"], nav a[href="#arena"]');
        navLinks.forEach(link => {
            link.style.display = 'none';
            link.classList.add('auth-hidden');
        });
    }

    clearAppData() {
        // Nettoyer AppState
        if (window.AppState) {
            window.AppState.currentUser = null;
            window.AppState.heroes = [];
        }

        // Déclencher l'événement de déconnexion
        window.dispatchEvent(new CustomEvent('userLoggedOut'));
    }

    // ==================== MÉTHODES UTILITAIRES ====================

    // Vérifier si l'utilisateur peut accéder à une section
    canAccessSection(sectionName) {
        const protectedSections = ['heroes', 'arena', 'profile'];
        
        if (protectedSections.includes(sectionName)) {
            return authService.isAuthenticated();
        }
        
        return true;
    }

    // Obtenir les informations de l'utilisateur actuel
    getCurrentUser() {
        return authService.getUserDisplayInfo();
    }

    // Vérifier les permissions utilisateur
    checkPermission(action) {
        return authService.canPerformAction(action);
    }

    // Forcer la synchronisation des données
    async forceSyncData() {
        if (!authService.isAuthenticated()) {
            throw new Error('Utilisateur non connecté');
        }

        const user = await authService.getCurrentUser();
        if (user) {
            await this.syncUserWithApp(user);
            await this.loadUserHeroes(user.id);
        }
    }

    // ==================== HELPERS POUR L'INTÉGRATION ====================

    // Middleware pour les routes nécessitant une authentification
    requireAuth(callback) {
        return (...args) => {
            if (!authService.isAuthenticated()) {
                authUI.showError('Vous devez être connecté pour effectuer cette action');
                return;
            }
            return callback(...args);
        };
    }

    // Wrapper pour les actions nécessitant une permission
    requirePermission(permission, callback) {
        return (...args) => {
            if (!authService.canPerformAction(permission)) {
                authUI.showError('Vous n\'avez pas les permissions nécessaires');
                return;
            }
            return callback(...args);
        };
    }
}

// Instance globale
export const githubSSOIntegration = new GitHubSSOIntegration();

// Auto-intégration au chargement
document.addEventListener('DOMContentLoaded', () => {
    githubSSOIntegration.integrate().catch(error => {
        console.error('❌ Échec intégration GitHub SSO:', error);
    });
});

// Pour compatibilité avec l'ancien système
window.githubSSOIntegration = githubSSOIntegration;