//Point d'entrée principal - Heroes Arena//

import {AppState} from './core/config.js';
import {uiManager} from './modules/ui.js';
import {dataManager} from './modules/data.js';
import {combatSystem} from './modules/combat.js';

class HeroesArena {
    constructor() {
        this.isInitialized = false;
        this.ui = uiManager;
        this.data = dataManager;
        this.combat = combatSystem;
    }

    async initialize() {
        if (this.isInitialized) return;

        try {
            console.log('🚀 Initialisation de Heroes Arena...');

            //Charger les données
            await this.data.loadHeroes();

            //Initialiser l'interface
            await this.ui.initialize();

            //Configurer le combat
            this.combat.onLogUpdate = (entry) => {
                this.ui.addLogEntry(entry.message, entry.type);
            };

            //Démarrer la sauvegarde automatique
            this.data.startAutoSave();

            //Afficher l'interface initiale
            this.ui.displayHeroes();
            this.ui.updateFighterSelectors();
            this.ui.addLogEntry('Bienvenue dans l\'arène ! Sélectionnez deux héros pour commencer le combat...', 'info');

            this.isInitialized = true;
            console.log('✅ Heroes Arena initialisé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            throw error;
        }
    }

    //=== Méthodes d'interface ===

    showSection(sectionName) {
        return this.ui.showSection(sectionName);
    }

    showAvatarCategory(category) {
        return this.ui.showAvatarCategory(category);
    }

    updateClassInfo() {
        return this.ui.updateClassInfo();
    }

    updateStats() {
        return this.ui.updateStats();
    }

    randomStats() {
        return this.ui.randomStats();
    }

    filterHeroes(filter) {
        return this.ui.filterHeroes(filter);
    }

    updateFighters() {
        return this.ui.updateFighters();
    }

    resetArena() {
        //Réinitialiser les sélections
        const selectors = [
            document.getElementById('fighter1Select'),
            document.getElementById('fighter2Select')
        ];

        selectors.forEach(select => {
            if (select) select.value ='';
        });

        //Réintialiser l'état
        AppState.fighter1 = null;
        AppState.fighter2 = null;

        //Arreter le combat en cours
        this.combat.stopCombat();

        //Mettre à jour l'affichage
        this.ui.updateFighters();
        this.ui.clearCombatLog();

        //Ajouter un message de bienvenue
        this.ui.addLogEntry('Bienvenue dans l\'arène ! Sélectionnez deux héros pour commencer le combat...', 'info');
    }

    stopCombat() {
        this.combat.stopCombat();

        const fightBtn = document.getElementById('fightBtn');
        if (fightBtn) fightBtn.disabled = false;
    }

    //=== Méthodes de gestion des héros ===

    async createHeroFromForm() {
        try {
            const nom = document.getElementById('heroName')?.value?.trim();
            const classe = document.getElementById('heroClass')?.value;
            const stats = this.ui.updateStats();

            if (!nom) {
                this.ui.showError('Veuillez enter un nom pour le héro');
                return false;
            }

            const result = await this.data.addHero({
                nom,
                avatar: this.ui.selectedAvatar,
                classe,
                ...stats
            });

            if (result.success) {
                this.ui.showSuccess('Héros créé avec succès !');

                //Réinitialiser le formulaire
                document.getElementById('heroName').value = '';
                this.ui.randomStats();

                //Afficher les héros et aller à la section héros
                this.ui.displayHeroes();
                this.ui.updateFighterSelectors();
                this.ui.showSection('heroes');

                return true;
            } else {
                this.ui.showError(result.error);
                return false;
            }

        } catch (error) {
            console.error('Erreur lors de la création du héros:', error);
            this.ui.showError('Erreur lors de la création du héros');
            return false;
        }
    }

    async deleteHero(index) {
        const hero = AppState.heroes[index];
        if (!hero) return;

        if (confirm(`Êtes-vous sûr de vouloir supprimer ce héros ?\n\n${hero.nom} (${hero.classe})`)) {
            const result = await this.data.deleteHero(index);

            if (result.success) {
                this.ui.showSuccess('Héros supprimé');
                this.ui.displayHeroes();
                this.ui.updateFighterSelectors();
            } else {
                this.ui.showError(result.error);
            }
        }
    }

    async healHero(index) {
        const hero = AppState.heroes[index];
        if (!hero) return;

        hero.heal();
        await this.data.saveHeroes();
        this.ui.displayHeroes();
        this.ui.showSuccess(`${hero.nom} a été complètement soigné !`);
    }

    showHeroDetails(index) {
        const hero = AppState.heroes[index];
        if (!hero) return;

        //Créer une modal simple avec les détails du héros
        const modal =document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
        <div class="modal-content">
        <div class="modal-header">
        <h2>${hero.nom}</h2>
        <button class="modal-close" onclick="this.closet('.modal-overlay').remove()">X</button>
        </div>
        
        <div class="modal-body">
        <div style="display: grid; grid-template-columns: auto 1fr; gap: 12px; margin-bottom: 20px;">
        
        <strong>Classe:</strong> <span>${hero.classe}</span>
        <strong>Niveau:</strong> <span>${hero.niveau}</span>
        <strong>Badge:</strong> <span>${hero.getBadgeText()}</span>
        <strong>Expérience:</strong> <span>${hero.xp} XP</span>
        <strong>Force:</strong> <span>${hero.force}</span>
        <strong>Agilité:</strong> <span>${hero.agility}</span>
        <strong>Magie:</strong> <span>${hero.magic}</span>
        <strong>Défense:</strong> <span>${hero.defense}</span>
        <strong>Points de vie:</strong> <span>${hero.pv}/${hero.pvMax}</span>
        <strong>Victoires:</strong> <span style="color: #10b981;">${hero.victoires}</span>
        <strong>Défaites:</strong> <span style="color: #ef4444;">${hero.defaites}</span>
        <strong>Ratio:</strong> <span style="color: #3b82f6;">${hero.getRatio()}%</span>
        </div>
        </div>
        
        <div class="modal-footer">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Fermer</button>
        </div>
        </div>
        `;

        document.body.appendChild(modal);

        //Fermer en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    //=== Méthodes de combat ===

    
}


