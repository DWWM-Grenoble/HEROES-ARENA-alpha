// Point d'entrée principal - Heroes Arena

import { AppState } from './core/config.js';
import { uiManager } from './modules/ui.js';
import { dataManager } from './modules/data.js';
import { combatSystem } from './modules/combat.js';

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
            
            // Charger les données
            await this.data.loadHeroes();
            
            // Initialiser l'interface
            await this.ui.initialize();
            
            // Configurer le combat
            this.combat.onLogUpdate = (entry) => {
                this.ui.addLogEntry(entry.message, entry.type);
            };
            
            // Démarrer la sauvegarde automatique
            this.data.startAutoSave();
            
            // Afficher l'interface initiale
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
    
    // === MÉTHODES D'INTERFACE ===
    
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
        // Réinitialiser les sélections
        const selectors = [
            document.getElementById('fighter1Select'),
            document.getElementById('fighter2Select')
        ];
        
        selectors.forEach(select => {
            if (select) select.value = '';
        });
        
        // Arrêter le combat en cours
        this.combat.stopCombat();
        
        // Utiliser la nouvelle fonction clearArena qui nettoie tout proprement
        this.ui.clearArena();
        
        console.log('🏛️ Arène réinitialisée manuellement');
        this.ui.clearCombatLog();
        
        // Ajouter un message de bienvenue
        this.ui.addLogEntry('Bienvenue dans l\'arène ! Sélectionnez deux héros pour commencer le combat...', 'info');
    }
    
    stopCombat() {
        this.combat.stopCombat();
        
        const fightBtn = document.getElementById('fightBtn');
        if (fightBtn) fightBtn.disabled = false;
    }
    
    // === MÉTHODES DE GESTION DES HÉROS ===
    
    async createHeroFromForm() {
        try {
            const nom = document.getElementById('heroName')?.value?.trim();
            const classe = document.getElementById('heroClass')?.value;
            const stats = this.ui.updateStats();
            
            if (!nom) {
                this.ui.showError('Veuillez entrer un nom pour le héros');
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
                
                // Réinitialiser le formulaire
                document.getElementById('heroName').value = '';
                this.ui.randomStats();
                
                // Afficher les héros et aller à la section héros
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
        
        // Créer une modal simple avec les détails du héros
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${hero.nom}</h2>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">×</button>
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
        
        // Fermer en cliquant à l'extérieur
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // === MÉTHODES DE COMBAT ===
    
    async startCombat() {
        if (!AppState.fighter1 || !AppState.fighter2) {
            this.ui.showError('Veuillez sélectionner deux combattants');
            return;
        }
        
        if (AppState.fighter1.id === AppState.fighter2.id) {
            this.ui.showError('Un héros ne peut pas combattre contre lui-même');
            return;
        }
        
        try {
            // Désactiver le bouton de combat
            const fightBtn = document.getElementById('fightBtn');
            if (fightBtn) fightBtn.disabled = true;
            
            // Nettoyer le log de combat
            this.ui.clearCombatLog();
            
            // Démarrer le combat
            const result = await this.combat.startCombat(AppState.fighter1, AppState.fighter2);
            
            if (result.success) {
                // Sauvegarder automatiquement
                await this.data.saveHeroes();
                
                // Mettre à jour l'affichage
                this.ui.displayHeroes();
                this.ui.updateFighterDisplay();
            } else {
                this.ui.showError(result.error);
            }
            
        } catch (error) {
            console.error('Erreur lors du démarrage du combat:', error);
            this.ui.showError('Erreur lors du démarrage du combat');
        } finally {
            // Réactiver le bouton
            setTimeout(() => {
                const fightBtn = document.getElementById('fightBtn');
                if (fightBtn) fightBtn.disabled = false;
            }, 1000);
        }
    }
    
    // === MÉTHODES D'IMPORT/EXPORT ===
    
    async exportData() {
        const result = await this.data.exportToFile();
        
        if (result.success) {
            this.ui.showSuccess(`Export réussi: ${result.filename}`);
        } else {
            this.ui.showError(result.error);
        }
    }
    
    async importData(file) {
        const result = await this.data.importFromFile(file);
        
        if (result.success) {
            this.ui.showSuccess(`Import réussi: ${result.imported}/${result.total} héros importés`);
            this.ui.displayHeroes();
            this.ui.updateFighterSelectors();
            
            if (result.errors.length > 0) {
                console.warn('Erreurs d\'import:', result.errors);
            }
        } else {
            this.ui.showError(result.error);
        }
        
        return result;
    }
    
    async loadData() {
        const result = await this.data.loadHeroes();
        
        if (result.success) {
            this.ui.showSuccess(`${result.count} héros chargés`);
            this.ui.displayHeroes();
            this.ui.updateFighterSelectors();
        } else {
            this.ui.showError(result.error);
        }
    }
    
    async clearAllData() {
        if (confirm('Êtes-vous sûr de vouloir supprimer tous les héros ?')) {
            const result = await this.data.clearAllHeroes();
            
            if (result.success) {
                this.ui.showSuccess(`${result.count} héros supprimés`);
                this.ui.displayHeroes();
                this.ui.updateFighterSelectors();
                this.resetArena();
            } else {
                this.ui.showError(result.error);
            }
        }
    }
    
    createDemoHeroes() {
        // Créer quelques héros de démonstration
        const demoHeroes = [
            { nom: 'Aragorn', classe: 'Guerrier', force: 35, agility: 25, magic: 15, defense: 25, avatar: 'warrior/warrior1.webp' },
            { nom: 'Gandalf', classe: 'Mage', force: 20, agility: 20, magic: 35, defense: 25, avatar: 'mage/mage1.webp' },
            { nom: 'Legolas', classe: 'Archer', force: 25, agility: 35, magic: 20, defense: 20, avatar: 'archer/archer1.webp' },
            { nom: 'Gimli', classe: 'Paladin', force: 30, agility: 15, magic: 20, defense: 35, avatar: 'paladin/paladin1.webp' }
        ];
        
        let created = 0;
        
        demoHeroes.forEach(async (heroData) => {
            const result = await this.data.addHero(heroData);
            if (result.success) {
                created++;
                if (created === demoHeroes.length) {
                    this.ui.showSuccess(`${created} héros de démo créés !`);
                    this.ui.displayHeroes();
                    this.ui.updateFighterSelectors();
                }
            }
        });
    }
    
    // === MÉTHODES DE DEBUG ===
    
    debug() {
        console.log('=== ÉTAT DE L\'APPLICATION ===');
        console.log('Heroes Arena:', this);
        console.log('App State:', AppState);
        console.log('UI Manager:', this.ui);
        console.log('Data Manager:', this.data);
        console.log('Combat System:', this.combat);
        console.log('Héros:', AppState.heroes);
        console.log('Combat en cours:', this.combat.getCurrentCombat());
    }
    
    getState() {
        return {
            isInitialized: this.isInitialized,
            heroCount: AppState.heroes.length,
            currentSection: this.ui.currentSection,
            currentCombat: this.combat.getCurrentCombat(),
            fighters: {
                fighter1: AppState.fighter1?.nom || null,
                fighter2: AppState.fighter2?.nom || null
            }
        };
    }
}

// Créer l'instance globale
const heroesArena = new HeroesArena();

// Initialiser l'application
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await heroesArena.initialize();
        
        // Remplacer l'objet temporaire par l'application réelle
        window.HeroesArena = heroesArena;
        window.uiManager = heroesArena.ui;
        
        // Marquer comme initialisé
        window.HeroesArena.isInitialized = heroesArena.isInitialized;
        
        console.log('🎮 Heroes Arena prêt !');
        
    } catch (error) {
        console.error('💥 Erreur fatale lors de l\'initialisation:', error);
        
        // Afficher un message d'erreur à l'utilisateur
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
                background: #fee2e2;
                border: 1px solid #ef4444;
                border-radius: 8px;
                padding: 16px;
                margin: 20px;
                color: #991b1b;
                text-align: center;
            ">
                <h3>🚨 Erreur de chargement</h3>
                <p>L'application n'a pas pu se charger correctement.</p>
                <button onclick="location.reload()" style="
                    background: #ef4444;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-top: 10px;
                ">Recharger la page</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }
});

// Exposer pour le debug
window.app = heroesArena;

export default heroesArena;