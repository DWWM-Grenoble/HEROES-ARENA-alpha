// Composant UI pour l'authentification GitHub SSO
import { authService } from '../services/auth-service.js';

class AuthUI {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        
        console.log('🎨 Auth UI initialisé');
    }

    // Initialiser l'interface d'authentification
    init() {
        if (this.isInitialized) return;

        // Gérer le callback GitHub au chargement de la page
        this.handleGitHubCallbackOnLoad();

        // Configurer les callbacks du service d'auth
        authService.setCallbacks({
            onLogin: (user) => this.onUserLogin(user),
            onLogout: () => this.onUserLogout(),
            onError: (error) => this.onAuthError(error)
        });

        // Créer l'interface
        this.createAuthInterface();

        // Vérifier l'état d'authentification initial
        this.updateAuthState();

        this.isInitialized = true;
        console.log('✅ Auth UI initialisé');
    }

    // Gérer le callback GitHub si présent dans l'URL
    async handleGitHubCallbackOnLoad() {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (urlParams.has('token') || urlParams.has('error')) {
            console.log('🔄 Callback GitHub détecté');
            await authService.handleGitHubCallback();
        }
    }

    // Créer l'interface d'authentification
    createAuthInterface() {
        // Créer le conteneur principal s'il n'existe pas
        let authContainer = document.getElementById('auth-container');
        if (!authContainer) {
            authContainer = document.createElement('div');
            authContainer.id = 'auth-container';
            authContainer.className = 'auth-container';
            
            // Insérer dans le header ou créer un header
            const header = document.querySelector('header') || document.querySelector('.header');
            if (header) {
                header.appendChild(authContainer);
            } else {
                document.body.insertBefore(authContainer, document.body.firstChild);
            }
        }

        // Créer le HTML de l'interface
        authContainer.innerHTML = `
            <div class="auth-widget">
                <!-- État non connecté -->
                <div id="auth-logged-out" class="auth-state" style="display: none;">
                    <button id="github-login-btn" class="btn btn-github">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                        </svg>
                        Se connecter avec GitHub
                    </button>
                    <div id="auth-error" class="auth-error" style="display: none;"></div>
                </div>

                <!-- État connecté -->
                <div id="auth-logged-in" class="auth-state" style="display: none;">
                    <div class="auth-user-info">
                        <img id="auth-user-avatar" class="auth-avatar" src="" alt="Avatar">
                        <div class="auth-user-details">
                            <span id="auth-username" class="auth-username"></span>
                            <span id="auth-user-role" class="auth-role"></span>
                        </div>
                        <div class="auth-dropdown">
                            <button id="auth-menu-btn" class="auth-menu-btn">⋮</button>
                            <div id="auth-dropdown-menu" class="auth-dropdown-menu" style="display: none;">
                                <button id="auth-profile-btn" class="auth-menu-item">
                                    👤 Profil
                                </button>
                                <button id="auth-settings-btn" class="auth-menu-item">
                                    ⚙️ Paramètres
                                </button>
                                <hr class="auth-menu-separator">
                                <button id="auth-logout-btn" class="auth-menu-item auth-logout">
                                    🚪 Déconnexion
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- État chargement -->
                <div id="auth-loading" class="auth-state" style="display: none;">
                    <div class="auth-spinner"></div>
                    <span>Connexion...</span>
                </div>
            </div>
        `;

        // Ajouter les styles
        this.addAuthStyles();

        // Attacher les événements
        this.attachEventListeners();
    }

    // Ajouter les styles CSS
    addAuthStyles() {
        if (document.getElementById('auth-styles')) return;

        const style = document.createElement('style');
        style.id = 'auth-styles';
        style.textContent = `
            .auth-container {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
            }

            .auth-widget {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                padding: 12px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .auth-state {
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .btn-github {
                display: flex;
                align-items: center;
                gap: 8px;
                background: #24292e;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 14px;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .btn-github:hover {
                background: #1b1f23;
            }

            .auth-user-info {
                display: flex;
                align-items: center;
                gap: 12px;
                position: relative;
            }

            .auth-avatar {
                width: 32px;
                height: 32px;
                border-radius: 50%;
                border: 2px solid #e1e5e9;
            }

            .auth-user-details {
                display: flex;
                flex-direction: column;
                gap: 2px;
            }

            .auth-username {
                font-weight: 600;
                font-size: 14px;
                color: #24292e;
            }

            .auth-role {
                font-size: 12px;
                color: #586069;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .auth-menu-btn {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                padding: 4px 8px;
                border-radius: 4px;
                color: #586069;
            }

            .auth-menu-btn:hover {
                background: #f6f8fa;
            }

            .auth-dropdown {
                position: relative;
            }

            .auth-dropdown-menu {
                position: absolute;
                top: 100%;
                right: 0;
                background: white;
                border: 1px solid #e1e5e9;
                border-radius: 6px;
                box-shadow: 0 8px 24px rgba(140, 149, 159, 0.2);
                min-width: 160px;
                padding: 8px 0;
                margin-top: 4px;
            }

            .auth-menu-item {
                display: flex;
                align-items: center;
                gap: 8px;
                width: 100%;
                background: none;
                border: none;
                padding: 8px 16px;
                text-align: left;
                cursor: pointer;
                font-size: 14px;
                color: #24292e;
            }

            .auth-menu-item:hover {
                background: #f6f8fa;
            }

            .auth-logout {
                color: #d73a49;
            }

            .auth-logout:hover {
                background: #ffeef0;
            }

            .auth-menu-separator {
                border: none;
                border-top: 1px solid #e1e5e9;
                margin: 4px 0;
            }

            .auth-error {
                background: #ffeef0;
                color: #d73a49;
                padding: 8px 12px;
                border-radius: 4px;
                font-size: 13px;
                margin-top: 8px;
                border: 1px solid #f1b3ba;
            }

            .auth-spinner {
                width: 16px;
                height: 16px;
                border: 2px solid #e1e5e9;
                border-top: 2px solid #0366d6;
                border-radius: 50%;
                animation: auth-spin 1s linear infinite;
            }

            @keyframes auth-spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            /* Mode sombre */
            @media (prefers-color-scheme: dark) {
                .auth-widget {
                    background: rgba(30, 30, 30, 0.95);
                    border-color: rgba(255, 255, 255, 0.1);
                }

                .auth-username {
                    color: #f0f6fc;
                }

                .auth-role, .auth-menu-btn {
                    color: #8b949e;
                }

                .auth-dropdown-menu {
                    background: #21262d;
                    border-color: #30363d;
                }

                .auth-menu-item {
                    color: #f0f6fc;
                }

                .auth-menu-item:hover {
                    background: #30363d;
                }

                .auth-menu-btn:hover {
                    background: #30363d;
                }
            }
        `;

        document.head.appendChild(style);
    }

    // Attacher les événements
    attachEventListeners() {
        // Bouton de connexion GitHub
        const githubBtn = document.getElementById('github-login-btn');
        if (githubBtn) {
            githubBtn.addEventListener('click', () => {
                this.showLoadingState();
                authService.loginWithGitHub();
            });
        }

        // Menu utilisateur
        const menuBtn = document.getElementById('auth-menu-btn');
        const dropdown = document.getElementById('auth-dropdown-menu');
        
        if (menuBtn && dropdown) {
            menuBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
            });

            // Fermer le menu en cliquant ailleurs
            document.addEventListener('click', () => {
                dropdown.style.display = 'none';
            });
        }

        // Bouton de déconnexion
        const logoutBtn = document.getElementById('auth-logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.showLoadingState();
                authService.logout();
            });
        }

        // Boutons du menu (à implémenter)
        const profileBtn = document.getElementById('auth-profile-btn');
        const settingsBtn = document.getElementById('auth-settings-btn');

        if (profileBtn) {
            profileBtn.addEventListener('click', () => this.showProfile());
        }

        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }
    }

    // ==================== GESTION DES ÉTATS ====================

    showLoadingState() {
        this.hideAllStates();
        document.getElementById('auth-loading').style.display = 'flex';
    }

    showLoggedOutState() {
        this.hideAllStates();
        document.getElementById('auth-logged-out').style.display = 'block';
    }

    showLoggedInState(user) {
        this.hideAllStates();
        
        // Mettre à jour les informations utilisateur
        document.getElementById('auth-user-avatar').src = user.avatar || '/assets/avatars/default.png';
        document.getElementById('auth-username').textContent = user.username;
        document.getElementById('auth-user-role').textContent = user.role;
        
        document.getElementById('auth-logged-in').style.display = 'flex';
    }

    hideAllStates() {
        document.getElementById('auth-logged-out').style.display = 'none';
        document.getElementById('auth-logged-in').style.display = 'none';
        document.getElementById('auth-loading').style.display = 'none';
    }

    showError(message) {
        const errorDiv = document.getElementById('auth-error');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            // Masquer l'erreur après 5 secondes
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        }
    }

    // ==================== CALLBACKS ====================

    onUserLogin(user) {
        console.log('✅ Utilisateur connecté:', user.username);
        this.currentUser = user;
        this.showLoggedInState(user);
        
        // Notification de succès
        this.showNotification(`Bienvenue, ${user.username} !`, 'success');
    }

    onUserLogout() {
        console.log('👋 Utilisateur déconnecté');
        this.currentUser = null;
        this.showLoggedOutState();
        
        // Notification de déconnexion
        this.showNotification('Vous avez été déconnecté', 'info');
    }

    onAuthError(error) {
        console.error('❌ Erreur d\'authentification:', error.message);
        this.showLoggedOutState();
        this.showError(error.message);
    }

    // ==================== MÉTHODES PUBLIQUES ====================

    // Mettre à jour l'état d'authentification
    async updateAuthState() {
        if (authService.isAuthenticated()) {
            const user = authService.getUserDisplayInfo();
            if (user) {
                this.showLoggedInState(user);
            } else {
                this.showLoadingState();
                await authService.getCurrentUser();
                const updatedUser = authService.getUserDisplayInfo();
                if (updatedUser) {
                    this.showLoggedInState(updatedUser);
                } else {
                    this.showLoggedOutState();
                }
            }
        } else {
            this.showLoggedOutState();
        }
    }

    // Afficher le profil utilisateur
    showProfile() {
        console.log('👤 Afficher profil utilisateur');
        // TODO: Implémenter l'interface de profil
    }

    // Afficher les paramètres
    showSettings() {
        console.log('⚙️ Afficher paramètres');
        // TODO: Implémenter l'interface de paramètres
    }

    // Afficher une notification
    showNotification(message, type = 'info') {
        // Créer une notification simple
        const notification = document.createElement('div');
        notification.className = `auth-notification auth-notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 1001;
            animation: slideDown 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Supprimer après 3 secondes
        setTimeout(() => {
            notification.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Obtenir l'utilisateur actuel
    getCurrentUser() {
        return this.currentUser;
    }

    // Vérifier si l'utilisateur est connecté
    isLoggedIn() {
        return !!this.currentUser;
    }
}

// Styles pour les animations
const animationStyles = document.createElement('style');
animationStyles.textContent = `
    @keyframes slideDown {
        from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        to { transform: translateX(-50%) translateY(0); opacity: 1; }
    }
    @keyframes slideUp {
        from { transform: translateX(-50%) translateY(0); opacity: 1; }
        to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
    }
`;
document.head.appendChild(animationStyles);

// Instance globale
export const authUI = new AuthUI();

// Pour compatibilité avec l'ancien système
window.authUI = authUI;