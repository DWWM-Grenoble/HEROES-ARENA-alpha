// Initialisation refactorisée pour Heroes Arena
// Architecture modulaire avec services découplés

import { AppState } from './core/config.js';
import { eventManager, AppEvents } from './core/event-manager.js';
import { Hero } from './core/classes.js';
import { uiManager } from './modules/ui.js';
import { dataManager } from './modules/data.js';
import { combatSystem } from './modules/combat.js';
import { authSystem } from './modules/auth.js';

// Services
import { HeroService } from './services/hero-service.js';
import { CombatService } from './services/combat-service.js';
import { NavigationService } from './services/navigation-service.js';

// Templates
import { createHeroDetailsModal } from './templates/hero-details.js';

export async function initHeroesArenaRefactored() {
    try {
        console.log('🚀 Démarrage de Heroes Arena (Version Refactorisée)...');

        // Exposer Hero globalement pour compatibilité
        window.Hero = Hero;

        // Initialiser les services
        const heroService = new HeroService(dataManager, authSystem, uiManager);
        const combatService = new CombatService(combatSystem, dataManager, authSystem, uiManager);
        const navigationService = new NavigationService();

        // Configurer les événements de combat
        combatService.setupCombatCallbacks();

        // Créer l'application refactorisée
        const app = {
            // Services
            services: {
                hero: heroService,
                combat: combatService,
                navigation: navigationService
            },

            // Modules (pour compatibilité)
            ui: uiManager,
            data: dataManager,
            combat: combatSystem,
            auth: authSystem,
            events: eventManager,

            // === MÉTHODES D'INTERFACE (API Publique) ===

            // Navigation
            showSection(sectionName) {
                const result = this.services.navigation.showSection(sectionName);
                if (result.success) {
                    eventManager.emit(AppEvents.SECTION_CHANGED, { section: sectionName });
                }
                return result.success;
            },

            // Interface utilisateur
            showAvatarCategory(category) {
                return this.ui.showAvatarCategory(category);
            },

            updateClassInfo() {
                return this.ui.updateClassInfo();
            },

            updateStats() {
                return this.ui.updateStats();
            },

            randomStats() {
                return this.ui.randomStats();
            },

            filterHeroes(filter) {
                return this.ui.filterHeroes(filter);
            },

            updateFighters() {
                return this.ui.updateFighters();
            },

            // === GESTION DES HÉROS ===

            async createHeroFromForm() {
                const formData = this.extractHeroFormData();
                if (!formData) return false;

                const result = await this.services.hero.createHero(formData);
                
                if (result.success) {
                    eventManager.emit(AppEvents.HERO_CREATED, { hero: result.hero });
                    this.resetHeroForm();
                    this.ui.showSection('heroes');
                }

                return result.success;
            },

            async deleteHero(heroIdOrIndex) {
                const result = await this.services.hero.deleteHero(heroIdOrIndex);
                if (result.success) {
                    eventManager.emit(AppEvents.HERO_DELETED, { heroId: heroIdOrIndex });
                }
                return result.success;
            },

            async healHero(index) {
                const result = await this.services.hero.healHero(index);
                if (result.success) {
                    eventManager.emit(AppEvents.HERO_HEALED, { index });
                }
                return result.success;
            },

            async renameHero(index) {
                const hero = AppState.heroes[index];
                if (!hero) return false;

                const newName = prompt(`Nouveau nom pour ${hero.nom} :`, hero.nom);
                if (!newName || newName.trim() === hero.nom) return false;

                const result = await this.services.hero.renameHero(index, newName);
                if (result.success) {
                    eventManager.emit(AppEvents.HERO_RENAMED, { index, oldName: hero.nom, newName });
                }
                return result.success;
            },

            showHeroDetails(index) {
                const heroInfo = this.services.hero.getHeroDetails(index);
                if (!heroInfo.found) {
                    this.ui.showError('Héros introuvable');
                    return;
                }

                this.displayHeroModal(heroInfo.hero, index);
                eventManager.emit(AppEvents.MODAL_OPENED, { type: 'hero-details', heroIndex: index });
            },

            // === GESTION DU COMBAT ===

            async startCombat() {
                const result = await this.services.combat.startCombat();
                if (result.success) {
                    eventManager.emit(AppEvents.COMBAT_STARTED, { 
                        fighter1: AppState.fighter1, 
                        fighter2: AppState.fighter2 
                    });
                }
                return result.success;
            },

            resetArena() {
                const result = this.services.combat.resetArena();
                if (result.success) {
                    eventManager.emit(AppEvents.COMBAT_ENDED, { type: 'reset' });
                }
                return result.success;
            },

            stopCombat() {
                const result = this.services.combat.stopCombat();
                if (result.success) {
                    eventManager.emit(AppEvents.COMBAT_PAUSED);
                }
                return result.success;
            },

            // === IMPORT/EXPORT ===

            async exportData() {
                const result = await this.data.exportToFile();
                if (result.success) {
                    this.ui.showSuccess(`Export réussi: ${result.filename}`);
                    eventManager.emit(AppEvents.DATA_EXPORTED, { filename: result.filename });
                } else {
                    this.ui.showError(result.error);
                }
                return result.success;
            },

            async loadData() {
                if (this.auth.isAuthenticated()) {
                    try {
                        const userHeroes = this.auth.getUserHeroes();
                        AppState.heroes = userHeroes || [];
                        
                        this.ui.showSuccess(`${AppState.heroes.length} héros chargés`);
                        this.refreshInterface();
                        eventManager.emit(AppEvents.HEROES_LOADED, { count: AppState.heroes.length });
                        
                        return true;
                    } catch (error) {
                        console.error('❌ Erreur lors du chargement des héros:', error);
                        AppState.heroes = [];
                        this.ui.showError('Erreur lors du chargement des héros');
                        return false;
                    }
                } else {
                    AppState.heroes = [];
                    this.auth.showAuthScreen();
                    return false;
                }
            },

            async clearAllData() {
                if (!confirm('Êtes-vous sûr de vouloir supprimer tous les héros ?')) {
                    return false;
                }

                const result = await this.data.clearAllHeroes();
                if (result.success) {
                    this.ui.showSuccess(`${result.count} héros supprimés`);
                    this.refreshInterface();
                    this.resetArena();
                    eventManager.emit(AppEvents.DATA_LOADED, { heroes: [] });
                } else {
                    this.ui.showError(result.error);
                }
                return result.success;
            },

            async createDemoHeroes() {
                const result = await this.services.hero.createDemoHeroes();
                return result.success;
            },

            // === MÉTHODES UTILITAIRES ===

            extractHeroFormData() {
                const nom = document.getElementById('heroName')?.value?.trim();
                const classe = document.getElementById('heroClass')?.value;
                const stats = this.ui.updateStats();

                if (!nom) {
                    this.ui.showError('Veuillez entrer un nom pour le héros');
                    return null;
                }

                return {
                    nom,
                    avatar: this.ui.selectedAvatar,
                    classe,
                    ...stats
                };
            },

            resetHeroForm() {
                const nameInput = document.getElementById('heroName');
                if (nameInput) nameInput.value = '';
                this.ui.randomStats();
            },

            refreshInterface() {
                this.ui.displayHeroes();
                this.ui.updateFighterSelectors();
                eventManager.emit(AppEvents.UI_UPDATED);
            },

            displayHeroModal(hero, index) {
                const modalHTML = createHeroDetailsModal(hero, index);
                const modalElement = document.createElement('div');
                modalElement.innerHTML = modalHTML;
                const modal = modalElement.firstElementChild;

                document.body.appendChild(modal);
                document.body.style.overflow = 'hidden';

                // Gestionnaire d'événements de la modal
                this.setupModalEventHandlers(modal, index);
            },

            setupModalEventHandlers(modal, index) {
                const closeModal = () => {
                    document.body.style.overflow = '';
                    modal.remove();
                    eventManager.emit(AppEvents.MODAL_CLOSED, { type: 'hero-details' });
                };

                modal.addEventListener('click', async (e) => {
                    if (e.target === modal) {
                        closeModal();
                        return;
                    }

                    const actionBtn = e.target.closest('.action-btn');
                    if (actionBtn) {
                        const action = actionBtn.dataset.action;
                        await this.handleModalAction(action, actionBtn, index);
                        closeModal();
                    }

                    if (e.target.classList.contains('modal-close') || 
                        e.target.classList.contains('modal-close-btn')) {
                        closeModal();
                    }
                });
            },

            async handleModalAction(action, button, index) {
                switch (action) {
                    case 'heal':
                        await this.healHero(index);
                        break;
                    case 'combat':
                        this.showSection('arena');
                        break;
                    case 'rename':
                        await this.renameHero(index);
                        break;
                    case 'delete':
                        const heroId = button.dataset.heroId;
                        const heroName = button.dataset.heroName;
                        if (await this.confirmHeroDeletion(heroName)) {
                            await this.deleteHero(heroId);
                        }
                        break;
                }
            },

            async confirmHeroDeletion(heroName) {
                const confirmMessage = `⚠️ ATTENTION - SUPPRESSION DÉFINITIVE\n\n` +
                                     `Voulez-vous vraiment supprimer ${heroName} ?\n\n` +
                                     `Cette action est IRRÉVERSIBLE.\n\n` +
                                     `Tapez "SUPPRIMER" pour confirmer :`;
                
                const confirmation = prompt(confirmMessage);
                return confirmation === "SUPPRIMER";
            },

            // Debug
            debug() {
                console.log('=== DEBUG HEROES ARENA (REFACTORISÉ) ===');
                console.log('Services:', this.services);
                console.log('AppState.heroes:', AppState.heroes);
                console.log('Event Manager:', eventManager);
                eventManager.debug();
                console.log('=======================================');
            },

            // Obtenir des statistiques
            getStats() {
                return {
                    ...this.services.combat.getCombatStats(),
                    events: eventManager.getEvents(),
                    currentSection: this.services.navigation.getCurrentSection()
                };
            }
        };

        // === INITIALISATION ===

        console.log('🔄 Vérification de l\'authentification...');
        
        if (app.auth.isAuthenticated()) {
            console.log('✅ Utilisateur connecté, chargement des héros...');
            await app.loadData();
        } else {
            console.log('🔐 Aucun utilisateur connecté');
            AppState.heroes = [];
        }

        await app.ui.initialize();
        app.data.startAutoSave();

        // Interface initiale
        app.refreshInterface();
        app.ui.addLogEntry('Bienvenue dans l\'arène ! Sélectionnez deux héros pour commencer le combat...', 'info');

        // Exposer globalement
        window.HeroesArena = app;
        window.app = app;

        // Fonctions globales simplifiées
        window.showHeroDetailsNow = (index) => app.showHeroDetails(index);
        window.deleteHeroNow = (heroIdOrIndex) => {
            const hero = typeof heroIdOrIndex === 'number' 
                ? AppState.heroes[heroIdOrIndex] 
                : AppState.heroes.find(h => h.id === heroIdOrIndex);
            
            if (hero && confirm(`⚠️ Supprimer définitivement ${hero.nom} ?\n\nCette action est irréversible.`)) {
                app.deleteHero(heroIdOrIndex);
            }
        };

        console.log('✅ Heroes Arena refactorisé initialisé avec succès');
        return app;

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation refactorisée:', error);
        throw error;
    }
}