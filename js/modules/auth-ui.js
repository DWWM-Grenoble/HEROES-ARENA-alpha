// ========== MODULE AUTH UI : modules/auth-ui.js ==========

import { cloudStorage } from '../cloud-storage.js';

export class AuthUI {
    constructor() {
        this.currentTab = 'login';
        this.isOnlineMode = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Formulaires
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Raccourci clavier pour fermer
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideAuth();
            }
        });
    }

    async checkAuthStatus() {
        if (cloudStorage.isLoggedIn()) {
            const verification = await cloudStorage.verifyToken();
            if (verification.valid) {
                this.showUserPanel();
                this.isOnlineMode = true;
                return;
            }
        }
        this.showAuth();
    }

    switchTab(tab) {
        this.currentTab = tab;

        // Mettre à jour les onglets
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[onclick="AuthUI.switchTab('${tab}')"]`).classList.add('active');

        // Mettre à jour les formulaires
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(`${tab}Form`).classList.add('active');

        // Effacer les messages d'erreur
        this.clearMessages();

        // Sauvegarder l'onglet actuel
        if (window.saveFormValues) window.saveFormValues();
    }

    async handleLogin() {
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;

        // Validation des champs vides
        if (!username) {
            this.showError('login', 'Le nom d\'utilisateur est requis');
            this.focusField('loginUsername');
            if (window.saveFormValues) window.saveFormValues();
            return;
        }
        
        if (!password) {
            this.showError('login', 'Le mot de passe est requis');
            this.focusField('loginPassword');
            if (window.saveFormValues) window.saveFormValues();
            return;
        }
        
        // Validation de la longueur minimale
        if (username.length < 3) {
            this.showError('login', 'Le nom d\'utilisateur doit contenir au moins 3 caractères');
            this.focusField('loginUsername');
            if (window.saveFormValues) window.saveFormValues();
            return;
        }
        
        if (password.length < 6) {
            this.showError('login', 'Le mot de passe doit contenir au moins 6 caractères');
            this.focusField('loginPassword');
            if (window.saveFormValues) window.saveFormValues();
            return;
        }

        this.setLoading('login', true);

        try {
            const result = await cloudStorage.login(username, password);

            if (result.success) {
                this.showUserPanel();
                this.hideAuth();
                this.isOnlineMode = true;

                // Charger les héros depuis le cloud
                await this.syncHeroesFromCloud();

                this.showNotification('Connexion réussie !', 'success');
                
                // Nettoyer les données sauvegardées après succès
                if (window.clearSavedFormData) window.clearSavedFormData();
            }
        } catch (error) {
            let errorMessage = 'Erreur de connexion';
            
            // Gestion spécifique des erreurs
            if (error.message) {
                if (error.message.includes('Invalid credentials')) {
                    errorMessage = 'Nom d\'utilisateur ou mot de passe incorrect';
                } else if (error.message.includes('Network')) {
                    errorMessage = 'Erreur de réseau. Vérifiez votre connexion internet';
                } else if (error.message.includes('Server')) {
                    errorMessage = 'Erreur du serveur. Veuillez réessayer plus tard';
                } else {
                    errorMessage = error.message;
                }
            }
            
            this.showError('login', errorMessage);
            this.shakeForm('loginForm');
            // Sauvegarder les valeurs en cas d'erreur
            if (window.saveFormValues) window.saveFormValues();
        } finally {
            this.setLoading('login', false);
        }
    }

    async handleRegister() {
        const username = document.getElementById('registerUsername').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const passwordConfirm = document.getElementById('registerPasswordConfirm').value;

        // Validation du nom d'utilisateur
        if (!username) {
            this.showError('register', 'Le nom d\'utilisateur est requis');
            this.focusField('registerUsername');
            if (window.saveFormValues) window.saveFormValues();
            return;
        }
        
        if (username.length < 3) {
            this.showError('register', 'Le nom d\'utilisateur doit contenir au moins 3 caractères');
            this.focusField('registerUsername');
            if (window.saveFormValues) window.saveFormValues();
            return;
        }
        
        if (username.length > 20) {
            this.showError('register', 'Le nom d\'utilisateur ne peut pas dépasser 20 caractères');
            this.focusField('registerUsername');
            if (window.saveFormValues) window.saveFormValues();
            return;
        }
        
        if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
            this.showError('register', 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres, tirets et underscores');
            this.focusField('registerUsername');
            if (window.saveFormValues) window.saveFormValues();
            return;
        }
        
        // Validation de l'email (si fourni)
        if (email && !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
            this.showError('register', 'Format d\'email invalide');
            this.focusField('registerEmail');
            if (window.saveFormValues) window.saveFormValues();
            return;
        }
        
        // Validation du mot de passe
        if (!password) {
            this.showError('register', 'Le mot de passe est requis');
            this.focusField('registerPassword');
            if (window.saveFormValues) window.saveFormValues();
            return;
        }
        
        if (password.length < 6) {
            this.showError('register', 'Le mot de passe doit contenir au moins 6 caractères');
            this.focusField('registerPassword');
            if (window.saveFormValues) window.saveFormValues();
            return;
        }
        
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
            this.showError('register', 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre');
            this.focusField('registerPassword');
            if (window.saveFormValues) window.saveFormValues();
            return;
        }
        
        // Validation de la confirmation
        if (!passwordConfirm) {
            this.showError('register', 'Veuillez confirmer le mot de passe');
            this.focusField('registerPasswordConfirm');
            if (window.saveFormValues) window.saveFormValues();
            return;
        }
        
        if (password !== passwordConfirm) {
            this.showError('register', 'Les mots de passe ne correspondent pas');
            this.focusField('registerPasswordConfirm');
            if (window.saveFormValues) window.saveFormValues();
            return;
        }

        this.setLoading('register', true);

        try {
            const result = await cloudStorage.register(username, password, email);

            if (result.success) {
                this.showSuccess('register', 'Inscription réussie ! Vous pouvez maintenant vous connecter.');

                // Basculer vers la connexion après 2 secondes
                setTimeout(() => {
                    this.switchTab('login');
                    document.getElementById('loginUsername').value = username;
                    // Nettoyer les données d'inscription mais garder le nom d'utilisateur pour la connexion
                    if (window.clearSavedFormData) window.clearSavedFormData();
                }, 2000);
            }
        } catch (error) {
            let errorMessage = 'Erreur lors de l\'inscription';
            
            // Gestion spécifique des erreurs
            if (error.message) {
                if (error.message.includes('Username already exists')) {
                    errorMessage = 'Ce nom d\'utilisateur est déjà pris';
                } else if (error.message.includes('Email already exists')) {
                    errorMessage = 'Cette adresse email est déjà utilisée';
                } else if (error.message.includes('Network')) {
                    errorMessage = 'Erreur de réseau. Vérifiez votre connexion internet';
                } else if (error.message.includes('Server')) {
                    errorMessage = 'Erreur du serveur. Veuillez réessayer plus tard';
                } else {
                    errorMessage = error.message;
                }
            }
            
            this.showError('register', errorMessage);
            this.shakeForm('registerForm');
            // Sauvegarder les valeurs en cas d'erreur
            if (window.saveFormValues) window.saveFormValues();
        } finally {
            this.setLoading('register', false);
        }
    }

    async logout() {
        try {
            await cloudStorage.logout();
            this.hideUserPanel();
            this.isOnlineMode = false;
            this.showAuth();
            this.showNotification('Déconnexion réussie', 'info');

            // Optionnel : effacer les données locales
            if (confirm('Voulez-vous également supprimer les données locales ?')) {
                if (window.HeroesArena && window.HeroesArena.clearAllHeroesHandler) {
                    window.HeroesArena.clearAllHeroesHandler();
                }
            }
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    }

    playOffline() {
        this.hideAuth();
        this.isOnlineMode = false;
        this.showNotification('Mode hors ligne activé', 'info');
    }

    showAuth() {
        document.getElementById('authOverlay').style.display = 'flex';
    }

    hideAuth() {
        document.getElementById('authOverlay').style.display = 'none';
    }

    showUserPanel() {
        const user = cloudStorage.getCurrentUser();
        if (!user) return;

        document.getElementById('userAvatar').textContent = user.username.charAt(0).toUpperCase();
        document.getElementById('userName').textContent = user.username;
        document.getElementById('userEmail').textContent = user.email || 'Pas d\'email';
        document.getElementById('userPanel').style.display = 'flex';
    }

    hideUserPanel() {
        document.getElementById('userPanel').style.display = 'none';
    }

    showError(form, message) {
        const errorEl = document.getElementById(`${form}Error`);
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        
        // Animation d'apparition
        errorEl.style.opacity = '0';
        errorEl.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            errorEl.style.transition = 'all 0.3s ease';
            errorEl.style.opacity = '1';
            errorEl.style.transform = 'translateY(0)';
        }, 10);
        
        // Auto-masquage après 10 secondes
        setTimeout(() => {
            if (errorEl.style.display === 'block') {
                errorEl.style.opacity = '0';
                setTimeout(() => {
                    errorEl.style.display = 'none';
                }, 300);
            }
        }, 10000);
    }

    showSuccess(form, message) {
        const successEl = document.getElementById(`${form}Success`);
        if (successEl) {
            successEl.textContent = message;
            successEl.style.display = 'block';
        }
    }

    clearMessages() {
        document.querySelectorAll('.error-message, .success-message').forEach(el => {
            el.style.opacity = '0';
            setTimeout(() => {
                el.style.display = 'none';
            }, 200);
        });
    }
    
    // Nouvelle méthode pour mettre le focus sur un champ
    focusField(fieldId) {
        setTimeout(() => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.focus();
                field.select();
            }
        }, 100);
    }
    
    // Nouvelle méthode pour animer les erreurs
    shakeForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.style.animation = 'shake 0.5s ease-in-out';
            setTimeout(() => {
                form.style.animation = '';
            }, 500);
        }
    }

    setLoading(form, loading) {
        const btn = document.getElementById(`${form}Btn`);
        btn.disabled = loading;
        btn.textContent = loading ?
            (form === 'login' ? 'Connexion...' : 'Inscription...') :
            (form === 'login' ? 'Se connecter' : 'S\'inscrire');
    }

    setSyncStatus(status, text) {
        const indicator = document.getElementById('syncIndicator');
        const syncText = document.getElementById('syncText');

        indicator.className = `sync-indicator ${status}`;
        syncText.textContent = text;
    }

    async syncHeroesFromCloud() {
        if (!this.isOnlineMode) return;

        try {
            this.setSyncStatus('syncing', 'Synchronisation...');

            const result = await cloudStorage.loadHeroes();
            if (result.success && result.heroes) {
                // Intégrer avec le système existant
                if (window.HeroesArena && window.HeroesArena.getAppState) {
                    const appState = window.HeroesArena.getAppState();

                    // Remplacer les héros locaux par ceux du cloud
                    appState.heroes.length = 0;
                    result.heroes.forEach(heroData => {
                        const hero = this.recreateHeroFromData(heroData);
                        if (hero) appState.heroes.push(hero);
                    });

                    // Mettre à jour l'affichage
                    if (window.HeroesArena.displayHeroes) {
                        window.HeroesArena.displayHeroes();
                    }
                    if (window.HeroesArena.updateFighterSelectors) {
                        window.HeroesArena.updateFighterSelectors();
                    }
                }

                this.setSyncStatus('', 'Synchronisé');
                this.showNotification(`${result.heroes.length} héros chargés depuis le cloud`, 'success');
            }
        } catch (error) {
            this.setSyncStatus('error', 'Erreur sync');
            console.error('Erreur de synchronisation:', error);
        }
    }

    async syncHeroesToCloud() {
        if (!this.isOnlineMode) return;

        try {
            this.setSyncStatus('syncing', 'Sauvegarde...');

            if (window.HeroesArena && window.HeroesArena.getAppState) {
                const appState = window.HeroesArena.getAppState();
                const heroesData = appState.heroes.map(hero => hero.toJSON());

                const result = await cloudStorage.saveHeroes(heroesData);
                if (result.success) {
                    this.setSyncStatus('', 'Synchronisé');
                    this.showNotification('Héros sauvegardés dans le cloud', 'success');
                }
            }
        } catch (error) {
            this.setSyncStatus('error', 'Erreur sync');
            console.error('Erreur de sauvegarde:', error);
        }
    }

    recreateHeroFromData(data) {
        // Utiliser la factory existante si disponible
        if (window.HeroesArena && window.HeroesArena.createHero) {
            // Cette fonction devra être adaptée pour accepter les données complètes
            return window.HeroesArena.createHeroFromData(data);
        }
        return null;
    }

    showNotification(message, type = 'info') {
        // Utiliser le système de notification existant si disponible
        if (window.eventManager && window.eventManager.showNotification) {
            window.eventManager.showNotification(message, type);
        } else {
            // Fallback simple
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    // Méthodes publiques pour l'intégration
    isOnline() {
        return this.isOnlineMode;
    }

    async autoSave() {
        if (this.isOnlineMode) {
            await this.syncHeroesToCloud();
        }
    }
}