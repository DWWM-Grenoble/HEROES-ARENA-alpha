// Service pour la gestion du combat
import { AppState } from '../core/config.js';

export class CombatService {
    constructor(combatSystem, dataManager, authSystem, uiManager) {
        this.combat = combatSystem;
        this.data = dataManager;
        this.auth = authSystem;
        this.ui = uiManager;
    }

    /**
     * Démarrer un combat
     */
    async startCombat() {
        try {
            // Validation des combattants
            const validation = this.validateFighters();
            if (!validation.valid) {
                this.ui.showError(validation.error);
                return { success: false, error: validation.error };
            }

            // Désactiver le bouton de combat
            this.toggleFightButton(false);

            // Nettoyer le log de combat
            this.ui.clearCombatLog();

            // Démarrer le combat
            const result = await this.combat.startCombat(AppState.fighter1, AppState.fighter2);

            if (result.success) {
                console.log('🏆 Combat terminé, sauvegarde des données...');
                
                // Sauvegarder les données
                await this.saveCombatResults();
                
                console.log('✅ Données sauvegardées après combat');
                return { success: true, result };
            } else {
                this.ui.showError(result.error);
                return result;
            }

        } catch (error) {
            console.error('Erreur lors du démarrage du combat:', error);
            this.ui.showError('Erreur lors du démarrage du combat');
            return { success: false, error: error.message };
        } finally {
            // Réactiver le bouton après un délai
            setTimeout(() => this.toggleFightButton(true), 1000);
        }
    }

    /**
     * Réinitialiser l'arène
     */
    resetArena() {
        try {
            // Réinitialiser les sélections
            this.clearFighterSelections();

            // Réinitialiser l'état
            AppState.fighter1 = null;
            AppState.fighter2 = null;

            // Arrêter le combat en cours
            this.combat.stopCombat();

            // Réinitialiser les effets visuels
            this.ui.resetCombatEffects();

            // Mettre à jour l'affichage
            this.ui.updateFighters();
            this.ui.clearCombatLog();

            // Ajouter un message de bienvenue
            this.ui.addLogEntry('Bienvenue dans l\'arène ! Sélectionnez deux héros pour commencer le combat...', 'info');

            return { success: true };
        } catch (error) {
            console.error('Erreur lors de la réinitialisation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Arrêter le combat en cours
     */
    stopCombat() {
        try {
            this.combat.stopCombat();
            this.toggleFightButton(true);
            return { success: true };
        } catch (error) {
            console.error('Erreur lors de l\'arrêt du combat:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Valider les combattants sélectionnés
     */
    validateFighters() {
        if (!AppState.fighter1 || !AppState.fighter2) {
            return { valid: false, error: 'Veuillez sélectionner deux combattants' };
        }

        if (AppState.fighter1.id === AppState.fighter2.id) {
            return { valid: false, error: 'Un héros ne peut pas combattre contre lui-même' };
        }

        return { valid: true };
    }

    /**
     * Basculer l'état du bouton de combat
     */
    toggleFightButton(enabled) {
        const fightBtn = document.getElementById('fightBtn');
        if (fightBtn) {
            fightBtn.disabled = !enabled;
        }
    }

    /**
     * Vider les sélections de combattants
     */
    clearFighterSelections() {
        const selectors = [
            document.getElementById('fighter1Select'),
            document.getElementById('fighter2Select')
        ];

        selectors.forEach(select => {
            if (select) select.value = '';
        });
    }

    /**
     * Sauvegarder les résultats du combat
     */
    async saveCombatResults() {
        try {
            // Sauvegarder automatiquement dans le système de données
            await this.data.saveHeroes();

            // Sauvegarder spécifiquement pour l'utilisateur connecté (double sécurité)
            this.auth.saveUserHeroes(AppState.heroes);

            // Mettre à jour l'affichage
            this.ui.displayHeroes();
            this.ui.updateFighterDisplay();

            // Mettre à jour les statistiques utilisateur
            this.auth.refreshUserStats();

            return { success: true };
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error);
            throw error;
        }
    }

    /**
     * Configurer les callbacks du système de combat
     */
    setupCombatCallbacks() {
        // Callback pour les mises à jour du log
        this.combat.onLogUpdate = (entry) => {
            this.ui.addLogEntry(entry.message, entry.type);
        };

        // Callback pour la fin de combat
        this.combat.onCombatEnd = (result) => {
            this.ui.showCombatEndModalSpectacular(result);
            // Forcer la mise à jour de l'affichage des héros
            setTimeout(() => {
                this.ui.forceUpdate();
            }, 500);
        };
    }

    /**
     * Obtenir les statistiques de combat globales
     */
    getCombatStats() {
        const stats = {
            totalHeroes: AppState.heroes.length,
            totalCombats: 0,
            totalVictories: 0,
            totalDefeats: 0,
            averageLevel: 0,
            topHero: null
        };

        if (AppState.heroes.length > 0) {
            AppState.heroes.forEach(hero => {
                stats.totalCombats += hero.victoires + hero.defaites;
                stats.totalVictories += hero.victoires;
                stats.totalDefeats += hero.defaites;
                stats.averageLevel += hero.niveau;

                if (!stats.topHero || hero.victoires > stats.topHero.victoires) {
                    stats.topHero = hero;
                }
            });

            stats.averageLevel = Math.round(stats.averageLevel / AppState.heroes.length);
        }

        return stats;
    }
}